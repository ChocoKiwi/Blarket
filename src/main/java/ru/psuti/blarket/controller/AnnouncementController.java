package ru.psuti.blarket.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import ru.psuti.blarket.dto.announcement.AnnouncementDTO;
import ru.psuti.blarket.dto.announcement.CreateAnnouncementDTO;
import ru.psuti.blarket.dto.announcement.UpdateAnnouncementDTO;
import ru.psuti.blarket.model.announcement.Announcement;
import ru.psuti.blarket.model.announcement.AnnouncementView;
import ru.psuti.blarket.model.announcement.Category;
import ru.psuti.blarket.model.user.Role;
import ru.psuti.blarket.model.user.User;
import ru.psuti.blarket.service.announcement.AnnouncementService;
import ru.psuti.blarket.repository.UserRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private static final Logger LOGGER = LoggerFactory.getLogger(AnnouncementController.class);
    private static final String ERROR_UNAUTHORIZED = "Неавторизован";
    private static final String ERROR_BUSINESS_RESTRICTED = "Обычные пользователи не могут создавать бизнес-объявления";

    private final AnnouncementService announcementService;
    private final UserRepository userRepository;

    private final String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }

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
            LOGGER.warn("Пользователь или email отсутствует");
            return null;
        }
        return userRepository.findByEmail(user.getEmail())
                .map(refreshedUser -> {
                    LOGGER.info("Обновлены данные: email={}, roles={}", refreshedUser.getEmail(), refreshedUser.getRoles());
                    return refreshedUser;
                })
                .orElseGet(() -> {
                    LOGGER.warn("Пользователь с email {} не найден", user.getEmail());
                    return user;
                });
    }

    @PostMapping
    public ResponseEntity<?> createAnnouncement(@RequestBody CreateAnnouncementDTO dto, @AuthenticationPrincipal User user) {
        if (user == null) {
            LOGGER.warn("Неавторизован доступ к созданию объявления");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        User refreshedUser = refreshUserFromDB(user);
        if (refreshedUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        if (isBusinessAnnouncement(dto) && !refreshedUser.getRoles().contains(Role.PRO) && !refreshedUser.getRoles().contains(Role.ADMIN)) {
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

    public static final Set<String> STOP_WORDS = new HashSet<>(Arrays.asList(
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
            List<Announcement.Status> defaultStatuses = List.of(Announcement.Status.ACTIVE, Announcement.Status.BUSINESS);
            announcements = announcementService.getAnnouncementsByUserAndStatusInSorted(user, defaultStatuses, sort);

            if (query != null && !query.trim().isEmpty()) {
                String searchQuery = query.trim().toLowerCase();
                LinkedHashSet<AnnouncementDTO> filteredAnnouncements = new LinkedHashSet<>();

                for (AnnouncementDTO ann : announcements) {
                    boolean titleMatch = ann.getTitle() != null && ann.getTitle().toLowerCase().contains(searchQuery);
                    boolean categoryMatch = ann.getCategoryName() != null && ann.getCategoryName().toLowerCase().contains(searchQuery);
                    if (titleMatch || categoryMatch) {
                        filteredAnnouncements.add(ann);
                    }
                }

                String[] keywords = searchQuery.split("\\s+");
                for (String keyword : keywords) {
                    if (keyword.length() < 2 || STOP_WORDS.contains(keyword)) continue;
                    for (AnnouncementDTO ann : announcements) {
                        boolean titleMatch = ann.getTitle() != null && ann.getTitle().toLowerCase().contains(keyword);
                        boolean categoryMatch = ann.getCategoryName() != null && ann.getCategoryName().toLowerCase().contains(keyword);
                        if (titleMatch || categoryMatch) {
                            filteredAnnouncements.add(ann);
                        }
                    }
                }

                announcements = filteredAnnouncements.stream().collect(Collectors.toList());
            }

            return ResponseEntity.ok(announcements);
        } catch (Exception e) {
            LOGGER.error("Ошибка при поиске объявлений для пользователя с ID {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Пользователь или объявления не найдены"));
        }
    }

    @GetMapping("/categories-by-announcements")
    public ResponseEntity<?> getCategoriesByAnnouncements(@RequestParam(required = false) String query, @AuthenticationPrincipal User user) {
        if (user == null) {
            LOGGER.warn("Неавторизован доступ к поиску категорий");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        User refreshedUser = refreshUserFromDB(user);
        if (refreshedUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        try {
            List<Category> categories = announcementService.getCategoriesByAnnouncements(query);
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            LOGGER.error("Ошибка при поиске категорий: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Ошибка сервера"));
        }
    }

    @GetMapping("/categories-by-product")
    public ResponseEntity<?> getCategoriesByProduct(@RequestParam(required = false) String query, @AuthenticationPrincipal User user) {
        if (user == null) {
            LOGGER.warn("Неавторизован доступ к поиску категорий по товару");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        User refreshedUser = refreshUserFromDB(user);
        if (refreshedUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        try {
            LOGGER.info("Поиск категорий по товару: {}", query);
            List<Category> categories = announcementService.getCategoriesByProduct(query);
            LOGGER.info("Найдено {} категорий для товара: {}", categories.size(), query);
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            LOGGER.error("Ошибка при поиске категорий по товару: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Ошибка сервера"));
        }
    }

    @GetMapping("/dynamic-completions")
    public ResponseEntity<?> getDynamicCompletions(
            @RequestParam(required = false) String query,
            @AuthenticationPrincipal User user) {
        if (user == null) {
            LOGGER.warn("Неавторизован доступ к динамичным подсказкам");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        User refreshedUser = refreshUserFromDB(user);
        if (refreshedUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        try {
            Set<String> completions = announcementService.getDynamicCompletions(query);
            return ResponseEntity.ok(completions);
        } catch (Exception e) {
            LOGGER.error("Ошибка при получении динамичных подсказок для запроса {}: {}", query, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Ошибка сервера"));
        }
    }

    @PostMapping("/draft")
    public ResponseEntity<?> createDraft(@RequestBody CreateAnnouncementDTO dto, @AuthenticationPrincipal User user) {
        if (user == null) {
            LOGGER.warn("Неавторизован доступ к созданию черновика");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        User refreshedUser = refreshUserFromDB(user);
        if (refreshedUser == null) {
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
            LOGGER.warn("Неавторизован доступ к обновлению объявления");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        User refreshedUser = refreshUserFromDB(user);
        if (refreshedUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        if (isBusinessAnnouncement(dto) && !refreshedUser.getRoles().contains(Role.PRO) && !refreshedUser.getRoles().contains(Role.ADMIN)) {
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
            LOGGER.warn("Неавторизован доступ к обновлению черновика");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        User refreshedUser = refreshUserFromDB(user);
        if (refreshedUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
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
            LOGGER.warn("Неавторизован доступ к удалению объявления");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        User refreshedUser = refreshUserFromDB(user);
        if (refreshedUser == null) {
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
            LOGGER.warn("Неавторизован доступ к изменению статуса");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        User refreshedUser = refreshUserFromDB(user);
        if (refreshedUser == null) {
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
            LOGGER.warn("Неавторизован доступ к получению объявлений");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        User refreshedUser = refreshUserFromDB(user);
        if (refreshedUser == null) {
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
                    announcements = announcementService.getAnnouncementsByUserAndStatusIn(user, statuses);
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
    public ResponseEntity<?> getAnnouncementById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user,
            HttpServletRequest request) {
        if (user == null) {
            LOGGER.warn("Неавторизован доступ к объявлению с ID {}", id);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Неавторизован"));
        }
        User refreshedUser = refreshUserFromDB(user);
        if (refreshedUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Неавторизован"));
        }
        try {
            Announcement announcement = announcementService.getPublicAnnouncementById(id);
            // Регистрируем посещение, visitorAddress не используется, так как берем из User
            announcementService.trackAnnouncementView(id, refreshedUser, null);
            return ResponseEntity.ok(AnnouncementDTO.fromAnnouncement(announcement));
        } catch (Exception e) {
            LOGGER.error("Ошибка при получении объявления с ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Объявление не найдено"));
        }
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<?> getAnnouncementStats(
            @PathVariable Long id,
            @RequestParam String start,
            @RequestParam String end,
            @AuthenticationPrincipal User user) {
        if (user == null) {
            LOGGER.warn("Неавторизован доступ к статистике объявления с ID {}", id);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        User refreshedUser = refreshUserFromDB(user);
        if (refreshedUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        try {
            Announcement announcement = announcementService.getAnnouncementById(id, refreshedUser);
            LocalDateTime startDate = LocalDateTime.parse(start);
            LocalDateTime endDate = LocalDateTime.parse(end);
            List<AnnouncementView> stats = announcementService.getAnnouncementViewsStats(id, startDate, endDate);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            LOGGER.error("Ошибка при получении статистики для объявления с ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}/unique-visitors")
    public ResponseEntity<?> getUniqueVisitors(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        if (user == null) {
            LOGGER.warn("Неавторизован доступ к статистике уникальных посетителей для объявления с ID {}", id);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        User refreshedUser = refreshUserFromDB(user);
        if (refreshedUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        try {
            Announcement announcement = announcementService.getAnnouncementById(id, refreshedUser);
            long uniqueVisitors = announcementService.getUniqueVisitorCount(id);
            return ResponseEntity.ok(Map.of("uniqueVisitors", uniqueVisitors));
        } catch (Exception e) {
            LOGGER.error("Ошибка при получении уникальных посетителей для объявления с ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}/user-visit-stats")
    public ResponseEntity<?> getUserVisitStats(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        if (user == null) {
            LOGGER.warn("Неавторизован доступ к статистике посещений по пользователям для объявления с ID {}", id);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        User refreshedUser = refreshUserFromDB(user);
        if (refreshedUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        try {
            Announcement announcement = announcementService.getAnnouncementById(id, refreshedUser);
            Map<User, Long> visitCounts = announcementService.getVisitCountsByUser(id);
            // Преобразуем в DTO для безопасной передачи (без пароля и лишних данных)
            Map<String, Long> result = visitCounts.entrySet().stream()
                    .collect(Collectors.toMap(
                            entry -> entry.getKey().getEmail(), // Или getName(), если хотите имя
                            Map.Entry::getValue
                    ));
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            LOGGER.error("Ошибка при получении статистики посещений по пользователям для объявления с ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/by-category/{categoryId}")
    public ResponseEntity<?> getAnnouncementsByCategory(@PathVariable Long categoryId) {
        try {
            LOGGER.info("Получение объявлений для категории ID: {}", categoryId);
            List<AnnouncementDTO> announcements = announcementService.getAnnouncementsByCategory(categoryId);
            LOGGER.info("Возвращено {} объявлений для категории ID: {}", announcements.size(), categoryId);
            return ResponseEntity.ok(announcements);
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

    @GetMapping("/all-except-current")
    public ResponseEntity<?> getAllAnnouncementsExceptCurrentUser(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String sort) {
        if (user == null) {
            LOGGER.warn("Неавторизован доступ к объявлениям");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        try {
            User refreshedUser = refreshUserFromDB(user);
            if (refreshedUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
            }
            List<AnnouncementDTO> announcements = announcementService.getAllAnnouncementsSorted(sort);
            announcements = announcements.stream()
                    .filter(ann -> !ann.getUserId().equals(refreshedUser.getId()))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(announcements);
        } catch (Exception e) {
            LOGGER.error("Ошибка при получении объявлений: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Ошибка сервера"));
        }
    }

    @GetMapping("/global-search")
    public ResponseEntity<?> globalSearch(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String sort,
            @AuthenticationPrincipal User user) {
        if (user == null) {
            LOGGER.warn("Неавторизован доступ к глобальному поиску");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        User refreshedUser = refreshUserFromDB(user);
        if (refreshedUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        try {
            List<AnnouncementDTO> announcements = announcementService.searchAnnouncementsGlobally(query, sort);
            announcements = announcements.stream()
                    .filter(ann -> !ann.getUserId().equals(refreshedUser.getId()))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(announcements);
        } catch (Exception e) {
            LOGGER.error("Ошибка при глобальном поиске: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Ошибка сервера"));
        }
    }

    @GetMapping("/word-completions")
    public ResponseEntity<?> getWordCompletions(
            @RequestParam(required = false) String prefix,
            @AuthenticationPrincipal User user) {
        if (user == null) {
            LOGGER.warn("Неавторизован доступ к автодополнению");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        User refreshedUser = refreshUserFromDB(user);
        if (refreshedUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        try {
            Set<String> completions = announcementService.getWordCompletions(prefix);
            return ResponseEntity.ok(completions);
        } catch (Exception e) {
            LOGGER.error("Ошибка при автодополнении для префикса {}: {}", prefix, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Ошибка сервера"));
        }
    }
}