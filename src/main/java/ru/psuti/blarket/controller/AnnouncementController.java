package ru.psuti.blarket.controller;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import ru.psuti.blarket.dto.AnnouncementDTO;
import ru.psuti.blarket.dto.CreateAnnouncementDTO;
import ru.psuti.blarket.dto.UpdateAnnouncementDTO;
import ru.psuti.blarket.model.Announcement;
import ru.psuti.blarket.model.Role;
import ru.psuti.blarket.model.User;
import ru.psuti.blarket.service.AnnouncementService;
import ru.psuti.blarket.repository.UserRepository; // Добавьте зависимость

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private static final Logger LOGGER = LoggerFactory.getLogger(AnnouncementController.class);
    private static final String ERROR_UNAUTHORIZED = "Неавторизован";
    private static final String ERROR_BUSINESS_RESTRICTED = "Обычные пользователи не могут создавать бизнес-объявления (условие: BUYSELL, цена ≥ 100,000 или количество ≥ 35)";

    private final AnnouncementService announcementService;
    private final UserRepository userRepository; // Добавьте репозиторий для загрузки пользователя

    private boolean isBusinessAnnouncement(CreateAnnouncementDTO dto) {
        boolean isBusiness = (dto.getPrice() != null && new BigDecimal(String.valueOf(dto.getPrice())).compareTo(new BigDecimal("100000")) >= 0) ||
                (dto.getQuantity() != null && dto.getQuantity() >= 35) ||
                (dto.getItemCondition() == Announcement.Condition.BUYSELL);
        LOGGER.debug("Проверка бизнес-объявления: condition={}, price={}, quantity={}, isBusiness={}",
                dto.getItemCondition(), dto.getPrice(), dto.getQuantity(), isBusiness);
        return isBusiness;
    }

    private boolean isBusinessAnnouncement(UpdateAnnouncementDTO dto) {
        boolean isBusiness = (dto.getPrice() != null && new BigDecimal(String.valueOf(dto.getPrice())).compareTo(new BigDecimal("100000")) >= 0) ||
                (dto.getQuantity() != null && dto.getQuantity() >= 35) ||
                (dto.getItemCondition() == Announcement.Condition.BUYSELL);
        LOGGER.debug("Проверка бизнес-объявления: condition={}, price={}, quantity={}, isBusiness={}",
                dto.getItemCondition(), dto.getPrice(), dto.getQuantity(), isBusiness);
        return isBusiness;
    }

    private User refreshUserFromDB(User user) {
        if (user == null || user.getEmail() == null) {
            LOGGER.warn("Пользователь или email отсутствует в контексте аутентификации");
            return null;
        }
        return userRepository.findByEmail(user.getEmail())
                .map(refreshedUser -> {
                    LOGGER.info("Обновленные данные пользователя из БД: email={}, roles={}",
                            refreshedUser.getEmail(), refreshedUser.getRoles());
                    return refreshedUser;
                })
                .orElseGet(() -> {
                    LOGGER.warn("Пользователь с email {} не найден в БД", user.getEmail());
                    return user;
                });
    }

    @PostMapping
    public ResponseEntity<?> createAnnouncement(@RequestBody CreateAnnouncementDTO dto, @AuthenticationPrincipal User user) {
        if (user == null) {
            LOGGER.warn("Неавторизованный доступ к созданию объявления");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        // Принудительно обновляем данные пользователя из БД
        User refreshedUser = refreshUserFromDB(user);
        if (refreshedUser == null) {
            LOGGER.warn("Не удалось обновить данные пользователя для создания объявления");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        LOGGER.debug("Создание объявления пользователем: email={}, roles={}", refreshedUser.getEmail(), refreshedUser.getRoles());
        if (isBusinessAnnouncement(dto) && !refreshedUser.getRoles().contains(Role.PRO) && !refreshedUser.getRoles().contains(Role.ADMIN)) {
            LOGGER.warn("Пользователь с email {} и ролями {} пытается создать бизнес-объявление", refreshedUser.getEmail(), refreshedUser.getRoles());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", ERROR_BUSINESS_RESTRICTED));
        }
        try {
            Announcement announcement = announcementService.createAnnouncement(dto, refreshedUser, false);
            return ResponseEntity.status(HttpStatus.CREATED).body(announcement);
        } catch (Exception e) {
            LOGGER.error("Ошибка при создании объявления: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    private static final Set<String> STOP_WORDS = new HashSet<>(Arrays.asList(
            "и", "или", "для", "в", "на", "по", "с", "у", "к", "от", "до", "из", "о", "об", "при", "без",
            "а", "но", "если", "что", "как", "чтобы", "за", "над", "под", "про", "это", "этот", "эта", "эти"
    ));

    @GetMapping("/user/{userId}/search")
    public ResponseEntity<?> searchAnnouncementsByUserAndTitle(
            @PathVariable Long userId,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String sort) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
            List<AnnouncementDTO> announcements;
            // Получаем все объявления пользователя с учетом сортировки
            List<Announcement.Status> defaultStatuses = List.of(Announcement.Status.ACTIVE, Announcement.Status.BUSINESS);
            announcements = announcementService.getAnnouncementsByUserAndStatusInSorted(user, defaultStatuses, sort);

            // Фильтруем по запросу, если он есть
            if (query != null && !query.trim().isEmpty()) {
                String searchQuery = query.trim().toLowerCase();
                // Используем LinkedHashSet для сохранения порядка и исключения дубликатов
                LinkedHashSet<AnnouncementDTO> filteredAnnouncements = new LinkedHashSet<>();

                // 1. Сначала ищем полное совпадение с запросом
                for (AnnouncementDTO ann : announcements) {
                    boolean titleMatch = ann.getTitle() != null && ann.getTitle().toLowerCase().contains(searchQuery);
                    boolean categoryMatch = ann.getCategoryName() != null && ann.getCategoryName().toLowerCase().contains(searchQuery);
                    if (titleMatch || categoryMatch) {
                        filteredAnnouncements.add(ann);
                    }
                }

                // 2. Разбиваем запрос на слова и ищем совпадения по каждому слову, исключая стоп-слова
                String[] keywords = searchQuery.split("\\s+"); // Разделяем по пробелам
                for (String keyword : keywords) {
                    if (keyword.length() < 2 || STOP_WORDS.contains(keyword)) continue; // Пропускаем короткие слова и стоп-слова
                    for (AnnouncementDTO ann : announcements) {
                        boolean titleMatch = ann.getTitle() != null && ann.getTitle().toLowerCase().contains(keyword);
                        boolean categoryMatch = ann.getCategoryName() != null && ann.getCategoryName().toLowerCase().contains(keyword);
                        if (titleMatch || categoryMatch) {
                            filteredAnnouncements.add(ann); // LinkedHashSet сохраняет порядок и исключает дубли
                        }
                    }
                }

                // Преобразуем LinkedHashSet обратно в список
                announcements = filteredAnnouncements.stream().collect(Collectors.toList());
            }

            return ResponseEntity.ok(announcements);
        } catch (Exception e) {
            LOGGER.error("Ошибка при поиске объявлений для пользователя с ID {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Пользователь или объявления не найдены"));
        }
    }

    @PostMapping("/draft")
    public ResponseEntity<?> createDraft(@RequestBody CreateAnnouncementDTO dto, @AuthenticationPrincipal User user) {
        if (user == null) {
            LOGGER.warn("Неавторизованный доступ к созданию черновика");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        // Принудительно обновляем данные пользователя из БД
        User refreshedUser = refreshUserFromDB(user);
        if (refreshedUser == null) {
            LOGGER.warn("Не удалось обновить данные пользователя для создания черновика");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        try {
            Announcement announcement = announcementService.createAnnouncement(dto, refreshedUser, true);
            return ResponseEntity.status(HttpStatus.CREATED).body(announcement);
        } catch (Exception e) {
            LOGGER.error("Ошибка при создании черновика: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAnnouncement(@PathVariable Long id, @RequestBody UpdateAnnouncementDTO dto, @AuthenticationPrincipal User user) {
        if (user == null) {
            LOGGER.warn("Неавторизованный доступ к обновлению объявления");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        // Принудительно обновляем данные пользователя из БД
        User refreshedUser = refreshUserFromDB(user);
        if (refreshedUser == null) {
            LOGGER.warn("Не удалось обновить данные пользователя для обновления объявления");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        LOGGER.debug("Обновление объявления пользователем: email={}, roles={}", refreshedUser.getEmail(), refreshedUser.getRoles());
        if (isBusinessAnnouncement(dto) && !refreshedUser.getRoles().contains(Role.PRO) && !refreshedUser.getRoles().contains(Role.ADMIN)) {
            LOGGER.warn("Пользователь с email {} и ролями {} пытается обновить объявление до бизнес-статуса", refreshedUser.getEmail(), refreshedUser.getRoles());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", ERROR_BUSINESS_RESTRICTED));
        }
        try {
            Announcement announcement = announcementService.updateAnnouncement(id, dto, refreshedUser, false);
            return ResponseEntity.ok(announcement);
        } catch (Exception e) {
            LOGGER.error("Ошибка при обновлении объявления с ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/draft")
    public ResponseEntity<?> updateDraft(@PathVariable Long id, @RequestBody UpdateAnnouncementDTO dto, @AuthenticationPrincipal User user) {
        if (user == null) {
            LOGGER.warn("Неавторизованный доступ к обновлению черновика");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        // Принудительно обновляем данные пользователя из БД
        User refreshedUser = refreshUserFromDB(user);
        if (refreshedUser == null) {
            LOGGER.warn("Не удалось обновить данные пользователя для обновления черновика");
        }
        try {
            Announcement announcement = announcementService.updateAnnouncement(id, dto, refreshedUser, true);
            return ResponseEntity.ok(announcement);
        } catch (Exception e) {
            LOGGER.error("Ошибка при обновлении черновика с ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAnnouncement(@PathVariable Long id, @AuthenticationPrincipal User user) {
        if (user == null) {
            LOGGER.warn("Неавторизованный доступ к удалению объявления");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        // Принудительно обновляем данные пользователя из БД
        User refreshedUser = refreshUserFromDB(user);
        if (refreshedUser == null) {
            LOGGER.warn("Не удалось обновить данные пользователя для удаления объявления");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        try {
            announcementService.deleteAnnouncement(id, refreshedUser);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            LOGGER.error("Ошибка при удалении объявления с ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> request, @AuthenticationPrincipal User user) {
        if (user == null) {
            LOGGER.warn("Неавторизованный доступ к изменению статуса объявления");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        // Принудительно обновляем данные пользователя из БД
        User refreshedUser = refreshUserFromDB(user);
        if (refreshedUser == null) {
            LOGGER.warn("Не удалось обновить данные пользователя для изменения статуса");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        try {
            String status = request.get("status");
            Announcement announcement;
            switch (status.toUpperCase()) {
                case "ARCHIVED":
                    announcementService.archiveAnnouncement(id, refreshedUser);
                    return ResponseEntity.noContent().build();
                case "ACTIVE":
                    announcement = announcementService.publishAnnouncement(id, refreshedUser);
                    return ResponseEntity.ok(announcement);
                case "RESTORED":
                    announcement = announcementService.restoreAnnouncement(id, refreshedUser);
                    return ResponseEntity.ok(announcement);
                default:
                    return ResponseEntity.badRequest().body(Map.of("message", "Недопустимый статус"));
            }
        } catch (Exception e) {
            LOGGER.error("Ошибка при изменении статуса объявления с ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAnnouncements(@AuthenticationPrincipal User user, @RequestParam(required = false) String status) {
        if (user == null) {
            LOGGER.warn("Неавторизованный доступ к получению объявлений");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        // Принудительно обновляем данные пользователя из БД
        User refreshedUser = refreshUserFromDB(user);
        if (refreshedUser == null) {
            LOGGER.warn("Не удалось обновить данные пользователя для получения объявлений");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        try {
            List<AnnouncementDTO> announcements;
            if (status != null && !status.isEmpty()) {
                if (status.contains(",")) {
                    List<Announcement.Status> statuses = Arrays.stream(status.split(","))
                            .map(String::trim)
                            .map(String::toUpperCase)
                            .map(Announcement.Status::valueOf)
                            .collect(Collectors.toList());
                    announcements = announcementService.getAnnouncementsByUserAndStatusIn(user, statuses); // Исправлено: используем statuses
                } else {
                    Announcement.Status announcementStatus = Announcement.Status.valueOf(status.toUpperCase());
                    announcements = announcementService.getAnnouncementsByUserAndStatus(user, announcementStatus);
                }
            } else {
                announcements = announcementService.getAnnouncementsByUserAndStatus(refreshedUser, null);
            }
            return ResponseEntity.ok(announcements);
        } catch (IllegalArgumentException e) {
            LOGGER.error("Недопустимый статус: {}", status, e);
            return ResponseEntity.badRequest().body(Map.of("message", "Недопустимый статус"));
        } catch (Exception e) {
            LOGGER.error("Ошибка при получении объявлений: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Ошибка сервера"));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAnnouncementById(@PathVariable Long id, @AuthenticationPrincipal User user) {
        if (user == null) {
            LOGGER.warn("Неавторизованный доступ к получению объявления с ID {}", id);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Неавторизован"));
        }
        // Принудительно обновляем данные пользователя из БД
        User refreshedUser = refreshUserFromDB(user);
        if (refreshedUser == null) {
            LOGGER.warn("Не удалось обновить данные пользователя для получения объявления с ID {}", id);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Неавторизован"));
        }
        try {
            Announcement announcement = announcementService.getPublicAnnouncementById(id);
            return ResponseEntity.ok(UpdateAnnouncementDTO.fromAnnouncement(announcement));
        } catch (Exception e) {
            LOGGER.error("Ошибка при получении объявления с ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Объявление не найдено"));
        }
    }

    @GetMapping("/categories/{categoryId}")
    public ResponseEntity<?> getAnnouncementsByCategory(@PathVariable Long categoryId) {
        try {
            return ResponseEntity.ok(announcementService.getAnnouncementsByCategory(categoryId));
        } catch (Exception e) {
            LOGGER.error("Ошибка при получении объявлений для категории с ID {}: {}", categoryId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getAnnouncementsByUserId(@PathVariable Long userId,
                                                      @RequestParam(required = false) String status,
                                                      @RequestParam(required = false) String sort) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
            List<AnnouncementDTO> announcements;
            if (status != null && !status.isEmpty()) {
                if (status.contains(",")) {
                    List<Announcement.Status> statuses = Arrays.stream(status.split(","))
                            .map(String::trim)
                            .map(String::toUpperCase)
                            .map(Announcement.Status::valueOf)
                            .collect(Collectors.toList());
                    announcements = announcementService.getAnnouncementsByUserAndStatusInSorted(user, statuses, sort);
                } else {
                    Announcement.Status announcementStatus = Announcement.Status.valueOf(status.toUpperCase());
                    announcements = announcementService.getAnnouncementsByUserAndStatusInSorted(user, List.of(announcementStatus), sort);
                }
            } else {
                List<Announcement.Status> defaultStatuses = List.of(Announcement.Status.ACTIVE, Announcement.Status.BUSINESS);
                announcements = announcementService.getAnnouncementsByUserAndStatusInSorted(user, defaultStatuses, sort);
            }
            return ResponseEntity.ok(announcements);
        } catch (IllegalArgumentException e) {
            LOGGER.error("Недопустимый статус: {}", status, e);
            return ResponseEntity.badRequest().body(Map.of("message", "Недопустимый статус"));
        } catch (Exception e) {
            LOGGER.error("Ошибка при получении объявлений для пользователя с ID {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Пользователь или объявления не найдены"));
        }
    }
}