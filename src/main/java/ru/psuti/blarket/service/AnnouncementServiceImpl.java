package ru.psuti.blarket.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.Hibernate;
import org.springframework.stereotype.Service;
import ru.psuti.blarket.dto.AnnouncementDTO;
import ru.psuti.blarket.dto.CreateAnnouncementDTO;
import ru.psuti.blarket.dto.UpdateAnnouncementDTO;
import ru.psuti.blarket.model.Announcement;
import ru.psuti.blarket.model.AnnouncementView;
import ru.psuti.blarket.model.Category;
import ru.psuti.blarket.model.User;
import ru.psuti.blarket.repository.AnnouncementRepository;
import ru.psuti.blarket.repository.AnnouncementViewRepository;
import ru.psuti.blarket.repository.CategoryRepository;
import ru.psuti.blarket.repository.UserRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import static ru.psuti.blarket.controller.AnnouncementController.STOP_WORDS;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnnouncementServiceImpl implements AnnouncementService {

    private static final String ERROR_NOT_FOUND = "Объявление не найдено";
    private static final String ERROR_NOT_AUTHORIZED = "Нет прав для изменения или удаления объявления";
    private static final String ERROR_IMAGE_URLS = "Ошибка преобразования imageUrls";
    private static final String ERROR_CATEGORY_NOT_FOUND = "Категория не найдена";
    private static final BigDecimal BUSINESS_PRICE_THRESHOLD = new BigDecimal("100000");
    private static final int BUSINESS_QUANTITY_THRESHOLD = 35;

    private final AnnouncementRepository announcementRepository;
    private final CategoryRepository categoryRepository;
    private final ObjectMapper objectMapper;
    private final AnnouncementViewRepository announcementViewRepository;

    // Вспомогательный метод для преобразования Announcement в AnnouncementDTO
    private AnnouncementDTO toAnnouncementDTO(Announcement announcement) {
        AnnouncementDTO dto = new AnnouncementDTO();
        dto.setId(announcement.getId());
        dto.setTitle(announcement.getTitle());
        dto.setDescription(announcement.getDescription());
        dto.setPrice(announcement.getPrice());
        try {
            dto.setImageUrls(announcement.getImageUrls() != null
                    ? objectMapper.readValue(announcement.getImageUrls(), new TypeReference<List<String>>() {})
                    : List.of());
        } catch (Exception e) {
            log.error("Ошибка при разборе imageUrls для объявления ID {}: {}", announcement.getId(), e.getMessage(), e);
            dto.setImageUrls(List.of());
        }
        dto.setAddress(announcement.getAddress());
        dto.setQuantity(announcement.getQuantity());
        dto.setCreatedAt(announcement.getCreatedAt());
        dto.setUpdatedAt(announcement.getUpdatedAt());
        dto.setViews(announcement.getViews());
        dto.setCondition(announcement.getCondition());
        dto.setRating(announcement.getRating());
        dto.setCategoryId(announcement.getCategory() != null ? announcement.getCategory().getId() : null);
        dto.setCategoryName(announcement.getCategory() != null ? announcement.getCategory().getName() : null);
        dto.setUserId(announcement.getUser() != null ? announcement.getUser().getId() : null); // Устанавливаем userId
        dto.setAuthorName(announcement.getUser() != null ? announcement.getUser().getName() : null); // Устанавливаем имя автора
        dto.setStatus(announcement.getStatus());
        return dto;
    }

    @Override
    public Announcement createAnnouncement(CreateAnnouncementDTO dto, User user, boolean isDraft) {
        Announcement announcement = new Announcement();
        announcement.setUser(user);
        announcement.setTitle(dto.getTitle());
        announcement.setDescription(dto.getDescription());
        announcement.setPrice(dto.getPrice());
        // Проверка и установка imageUrls
        List<String> imageUrls = dto.getImageUrls() != null ? dto.getImageUrls() : Collections.emptyList();
        for (String url : imageUrls) {
            if (!url.startsWith("data:image/") || !url.contains(";base64,")) {
                throw new IllegalArgumentException("Некорректный формат изображения: " + url);
            }
        }
        announcement.setImageUrls(String.join(",", imageUrls)); // Сохраняем как строку с запятыми
        announcement.setAddress(dto.getAddress());
        announcement.setQuantity(dto.getQuantity() != null ? dto.getQuantity() : 1);
        announcement.setCondition(dto.getItemCondition());
        announcement.setStatus(isDraft ? Announcement.Status.DRAFT : Announcement.Status.ACTIVE);
        if (dto.getCategoryId() != null) {
            Category category = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Категория не найдена"));
            announcement.setCategory(category);
        }
        return announcementRepository.save(announcement);
    }

    private Announcement.Status determineStatus(CreateAnnouncementDTO dto) {
        if (dto.getPrice() != null && dto.getPrice().compareTo(BUSINESS_PRICE_THRESHOLD) > 0 ||
                dto.getItemCondition() == Announcement.Condition.BUYSELL ||
                (dto.getQuantity() != null && dto.getQuantity() > BUSINESS_QUANTITY_THRESHOLD)) {
            return Announcement.Status.BUSINESS;
        }
        return Announcement.Status.ACTIVE;
    }

    @Override
    public Announcement updateAnnouncement(Long id, UpdateAnnouncementDTO dto, User user, boolean isDraft) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Объявление не найдено"));
        if (!announcement.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Нет прав для редактирования объявления");
        }
        announcement.setTitle(dto.getTitle());
        announcement.setDescription(dto.getDescription());
        announcement.setPrice(dto.getPrice());
        List<String> imageUrls = dto.getImageUrls() != null ? dto.getImageUrls() : Collections.emptyList();
        for (String url : imageUrls) {
            if (!url.startsWith("data:image/") || !url.contains(";base64,")) {
                throw new IllegalArgumentException("Некорректный формат изображения: " + url);
            }
        }
        announcement.setImageUrls(String.join(",", imageUrls));
        announcement.setAddress(dto.getAddress());
        announcement.setQuantity(dto.getQuantity() != null ? dto.getQuantity() : 1);
        announcement.setCondition(dto.getItemCondition());
        announcement.setStatus(isDraft ? Announcement.Status.DRAFT : Announcement.Status.ACTIVE);
        if (dto.getCategoryId() != null) {
            Category category = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Категория не найдена"));
            announcement.setCategory(category);
        }
        return announcementRepository.save(announcement);
    }

    private Announcement.Status determineStatus(UpdateAnnouncementDTO dto) {
        if (dto.getPrice() != null && dto.getPrice().compareTo(BUSINESS_PRICE_THRESHOLD) > 0 ||
                dto.getItemCondition() == Announcement.Condition.BUYSELL ||
                (dto.getQuantity() != null && dto.getQuantity() > BUSINESS_QUANTITY_THRESHOLD)) {
            return Announcement.Status.BUSINESS;
        }
        return Announcement.Status.ACTIVE;
    }

    @Override
    public void deleteAnnouncement(Long id, User user) {
        log.info("Удаление объявления с ID: {} для пользователя с email: {}", id, user.getEmail());
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(ERROR_NOT_FOUND));
        if (!announcement.getUser().getId().equals(user.getId())) {
            log.warn("Попытка удаления объявления с ID: {} пользователем без прав: {}", id, user.getEmail());
            throw new RuntimeException(ERROR_NOT_AUTHORIZED);
        }
        announcementRepository.delete(announcement);
    }

    @Override
    public void archiveAnnouncement(Long id, User user) {
        log.info("Архивирование объявления с ID: {} для пользователя с email: {}", id, user.getEmail());
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(ERROR_NOT_FOUND));
        if (!announcement.getUser().getId().equals(user.getId())) {
            log.warn("Попытка архивирования объявления с ID: {} пользователем без прав: {}", id, user.getEmail());
            throw new RuntimeException(ERROR_NOT_AUTHORIZED);
        }
        announcement.setStatus(Announcement.Status.ARCHIVED);
        announcement.setUpdatedAt(LocalDateTime.now());
        announcementRepository.save(announcement);
    }

    @Override
    public List<AnnouncementDTO> getAnnouncementsByUserAndStatus(User user, Announcement.Status status) {
        log.info("Получение объявлений для пользователя с email: {} и статусом: {}", user.getEmail(), status);
        List<Announcement> announcements;
        if (status == null) {
            String[] statuses = {"ACTIVE", "BUSINESS"};
            announcements = announcementRepository.findByUserAndStatusIn(user, Arrays.stream(statuses)
                    .map(Announcement.Status::valueOf)
                    .collect(Collectors.toList()));
        } else {
            announcements = announcementRepository.findByUserAndStatus(user, status);
        }
        return announcements.stream()
                .map(this::toAnnouncementDTO)
                .collect(Collectors.toList());
    }

    @Override
    public Announcement getAnnouncementById(Long id, User user) {
        log.info("Получение объявления с ID: {} для пользователя с email: {}", id, user.getEmail());
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Объявление не найдено"));
        if (!announcement.getUser().getId().equals(user.getId())) {
            log.warn("Попытка доступа к объявлению с ID: {} пользователем без прав: {}", id, user.getEmail());
            throw new RuntimeException("Доступ запрещен");
        }
        return announcement;
    }

    @Override
    public Announcement getPublicAnnouncementById(Long id) {
        log.info("Получение публичного объявления с ID: {}", id);
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Объявление не найдено"));
        if (announcement.getStatus() == Announcement.Status.DRAFT || announcement.getStatus() == Announcement.Status.ARCHIVED) {
            log.warn("Попытка доступа к непубличному объявлению с ID: {} (статус: {})", id, announcement.getStatus());
            throw new RuntimeException("Объявление не найдено");
        }
        return announcement;
    }

    @Override
    public List<AnnouncementDTO> getAnnouncementsByCategory(Long categoryId) {
        log.info("Получение объявлений для категории с ID: {}", categoryId);
        categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Категория не найдена"));
        List<Announcement> announcements = announcementRepository.findByCategoryIdOrSubCategories(categoryId);
        List<AnnouncementDTO> result = announcements.stream()
                .map(this::toAnnouncementDTO)
                .collect(Collectors.toList());
        log.info("Возвращено {} объявлений для категории ID: {}", result.size(), categoryId);
        return result;
    }

    @Override
    public List<AnnouncementDTO> getAnnouncementsByUserAndStatusIn(User user, List<Announcement.Status> statuses) {
        log.info("Получение объявлений для пользователя с email: {} и статусами: {}", user.getEmail(), statuses);
        List<Announcement> announcements = announcementRepository.findByUserAndStatusIn(user, statuses);
        return announcements.stream()
                .map(this::toAnnouncementDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<AnnouncementDTO> getAnnouncementsByUserAndStatusInSorted(User user, List<Announcement.Status> statuses, String sort) {
        log.info("Получение объявлений для пользователя с email: {} и статусами: {}, сортировка: {}", user.getEmail(), statuses, sort);
        List<Announcement> announcements = announcementRepository.findByUserAndStatusIn(user, statuses);

        // Сортировка объявлений
        Comparator<Announcement> comparator;
        switch (sort != null ? sort.toLowerCase() : "popularity") {
            case "newest":
                comparator = Comparator.comparing(Announcement::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()));
                break;
            case "expensive":
                comparator = Comparator.comparing(Announcement::getPrice, Comparator.nullsLast(Comparator.reverseOrder()));
                break;
            case "cheapest":
                comparator = Comparator.comparing(Announcement::getPrice, Comparator.nullsLast(Comparator.naturalOrder()));
                break;
            case "rating":
                comparator = Comparator.comparing(Announcement::getRating, Comparator.nullsLast(Comparator.reverseOrder()));
                break;
            case "popularity":
            default:
                comparator = Comparator.comparing(Announcement::getViews, Comparator.nullsLast(Comparator.reverseOrder()));
                break;
        }

        // Применяем сортировку
        announcements = announcements.stream()
                .sorted(comparator)
                .collect(Collectors.toList());

        return announcements.stream()
                .map(this::toAnnouncementDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<AnnouncementDTO> getAllAnnouncementsSorted(String sort) {
        log.info("Получение всех объявлений с сортировкой: {}", sort);
        List<Announcement> announcements = announcementRepository.findAll()
                .stream()
                .filter(ann -> ann.getStatus() == Announcement.Status.ACTIVE || ann.getStatus() == Announcement.Status.BUSINESS)
                .collect(Collectors.toList());

        // Сортировка объявлений
        Comparator<Announcement> comparator;
        switch (sort != null ? sort.toLowerCase() : "popularity") {
            case "newest":
                comparator = Comparator.comparing(Announcement::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()));
                break;
            case "expensive":
                comparator = Comparator.comparing(Announcement::getPrice, Comparator.nullsLast(Comparator.reverseOrder()));
                break;
            case "cheapest":
                comparator = Comparator.comparing(Announcement::getPrice, Comparator.nullsLast(Comparator.naturalOrder()));
                break;
            case "rating":
                comparator = Comparator.comparing(Announcement::getRating, Comparator.nullsLast(Comparator.reverseOrder()));
                break;
            case "popularity":
            default:
                comparator = Comparator.comparing(Announcement::getViews, Comparator.nullsLast(Comparator.reverseOrder()));
                break;
        }

        announcements = announcements.stream()
                .sorted(comparator)
                .collect(Collectors.toList());

        return announcements.stream()
                .map(this::toAnnouncementDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<AnnouncementDTO> searchAnnouncementsGlobally(String query, String sort) {
        log.info("Глобальный поиск объявлений с запросом: {} и сортировкой: {}", query, sort);
        List<Announcement> announcements = announcementRepository.findAll()
                .stream()
                .filter(ann -> ann.getStatus() == Announcement.Status.ACTIVE || ann.getStatus() == Announcement.Status.BUSINESS)
                .collect(Collectors.toList());

        if (query != null && !query.trim().isEmpty()) {
            String searchQuery = query.trim().toLowerCase();
            LinkedHashSet<Announcement> filteredAnnouncements = new LinkedHashSet<>();

            // 1. Exact match for title or category
            for (Announcement ann : announcements) {
                boolean titleMatch = ann.getTitle() != null && ann.getTitle().toLowerCase().contains(searchQuery);
                boolean categoryMatch = ann.getCategory() != null && ann.getCategory().getName().toLowerCase().contains(searchQuery);
                if (titleMatch || categoryMatch) {
                    filteredAnnouncements.add(ann);
                }
            }

            // 2. Split query into words and match, excluding stop words
            String[] keywords = searchQuery.split("\\s+");
            for (String keyword : keywords) {
                if (keyword.length() < 2 || STOP_WORDS.contains(keyword)) continue;
                for (Announcement ann : announcements) {
                    boolean titleMatch = ann.getTitle() != null && ann.getTitle().toLowerCase().contains(keyword);
                    boolean categoryMatch = ann.getCategory() != null && ann.getCategory().getName().toLowerCase().contains(keyword);
                    if (titleMatch || categoryMatch) {
                        filteredAnnouncements.add(ann);
                    }
                }
            }

            announcements = new ArrayList<>(filteredAnnouncements);
        }

        // Sort announcements
        Comparator<Announcement> comparator;
        switch (sort != null ? sort.toLowerCase() : "popularity") {
            case "newest":
                comparator = Comparator.comparing(Announcement::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()));
                break;
            case "expensive":
                comparator = Comparator.comparing(Announcement::getPrice, Comparator.nullsLast(Comparator.reverseOrder()));
                break;
            case "cheapest":
                comparator = Comparator.comparing(Announcement::getPrice, Comparator.nullsLast(Comparator.naturalOrder()));
                break;
            case "rating":
                comparator = Comparator.comparing(Announcement::getRating, Comparator.nullsLast(Comparator.reverseOrder()));
                break;
            case "popularity":
            default:
                comparator = Comparator.comparing(Announcement::getViews, Comparator.nullsLast(Comparator.reverseOrder()));
                break;
        }

        announcements = announcements.stream()
                .sorted(comparator)
                .collect(Collectors.toList());

        List<AnnouncementDTO> result = announcements.stream()
                .map(this::toAnnouncementDTO)
                .collect(Collectors.toList());
        log.info("Глобальный поиск вернул {} объявлений для запроса: {}", result.size(), query);
        return result;
    }

    @Override
    public Set<String> getWordCompletions(String prefix) {
        log.info("Поиск автодополнений для префикса: {}", prefix);
        if (prefix == null || prefix.trim().length() < 2) return new LinkedHashSet<>();

        String lowerPrefix = prefix.trim().toLowerCase();
        Set<String> completions = new LinkedHashSet<>();

        // Get all active/business announcements
        List<Announcement> announcements = announcementRepository.findAll()
                .stream()
                .filter(ann -> ann.getStatus() == Announcement.Status.ACTIVE || ann.getStatus() == Announcement.Status.BUSINESS)
                .collect(Collectors.toList());

        // Split titles into words and find matches
        for (Announcement ann : announcements) {
            if (ann.getTitle() != null) {
                String[] words = ann.getTitle().toLowerCase().split("\\s+");
                for (String word : words) {
                    if (word.length() >= 2 && !STOP_WORDS.contains(word) && word.startsWith(lowerPrefix)) {
                        completions.add(word);
                        if (completions.size() >= 5) break;
                    }
                }
            }
            if (completions.size() >= 5) break;
        }

        return completions;
    }

    @Override
    public List<Category> getCategoriesByAnnouncements(String query) {
        log.info("Поиск категорий для объявлений с запросом: {}", query);
        List<Announcement> announcements = announcementRepository.findAll()
                .stream()
                .filter(ann -> ann.getStatus() == Announcement.Status.ACTIVE || ann.getStatus() == Announcement.Status.BUSINESS)
                .collect(Collectors.toList());

        if (query != null && !query.trim().isEmpty()) {
            String searchQuery = query.trim().toLowerCase();
            LinkedHashSet<Announcement> filteredAnnouncements = new LinkedHashSet<>();

            // Поиск по названию и категории
            for (Announcement ann : announcements) {
                boolean titleMatch = ann.getTitle() != null && ann.getTitle().toLowerCase().contains(searchQuery);
                boolean categoryMatch = ann.getCategory() != null && ann.getCategory().getName().toLowerCase().contains(searchQuery);
                if (titleMatch || categoryMatch) {
                    filteredAnnouncements.add(ann);
                }
            }

            // Разбиваем запрос на слова, исключая стоп-слова
            String[] keywords = searchQuery.split("\\s+");
            for (String keyword : keywords) {
                if (keyword.length() < 2 || STOP_WORDS.contains(keyword)) continue;
                for (Announcement ann : announcements) {
                    boolean titleMatch = ann.getTitle() != null && ann.getTitle().toLowerCase().contains(keyword);
                    boolean categoryMatch = ann.getCategory() != null && ann.getCategory().getName().toLowerCase().contains(keyword);
                    if (titleMatch || categoryMatch) {
                        filteredAnnouncements.add(ann);
                    }
                }
            }

            announcements = new ArrayList<>(filteredAnnouncements);
        }

        // Извлекаем категории (главные и дочерние) из найденных объявлений
        List<Category> result = new ArrayList<>();
        for (Announcement ann : announcements) {
            if (ann.getCategory() != null) {
                Hibernate.initialize(ann.getCategory().getParent());
                result.add(ann.getCategory());
                if (ann.getCategory().getParent() != null) {
                    result.add(ann.getCategory().getParent());
                }
            }
        }

        // Удаляем дубликаты
        return result.stream()
                .distinct()
                .collect(Collectors.toList());
    }

    @Override
    public List<Category> getCategoriesByProduct(String query) {
        if (query == null || query.trim().isEmpty()) return new ArrayList<>();
        String lowerQuery = query.trim().toLowerCase();
        List<Announcement> announcements = announcementRepository.findAll();
        Set<Category> categories = new HashSet<>();

        for (Announcement ann : announcements) {
            if (ann.getTitle() != null && ann.getTitle().toLowerCase().contains(lowerQuery)) {
                Category category = ann.getCategory();
                if (category != null) {
                    categories.add(category);
                    if (category.getParent() != null) {
                        categories.add(category.getParent());
                    }
                }
            }
        }

        List<Category> result = new ArrayList<>(categories);
        return result;
    }

    @Override
    public Set<String> getDynamicCompletions(String query) {
        Set<String> completions = new LinkedHashSet<>();
        if (query == null || query.trim().isEmpty()) return completions;

        String lowerQuery = query.trim().toLowerCase();
        List<Announcement> announcements = announcementRepository.findAll();
        Set<Long> categoryIds = new HashSet<>();

        // Поиск по товарам и категориям
        for (Announcement ann : announcements) {
            if (ann.getTitle() != null && ann.getTitle().toLowerCase().contains(lowerQuery)) {
                String[] words = ann.getTitle().split("\\s+");
                StringBuilder suggestion = new StringBuilder();
                int wordCount = 0;
                for (String word : words) {
                    suggestion.append(word).append(" ");
                    wordCount++;
                    if (wordCount >= 3 || wordCount >= words.length) break;
                }
                completions.add(suggestion.toString().trim());
                if (ann.getCategory() != null) {
                    categoryIds.add(ann.getCategory().getId());
                    if (ann.getCategory().getParent() != null) {
                        categoryIds.add(ann.getCategory().getParent().getId());
                    }
                }
            }
        }

        // Добавляем товары из тех же категорий
        for (Announcement ann : announcements) {
            if (ann.getCategory() != null && categoryIds.contains(ann.getCategory().getId())) {
                String[] words = ann.getTitle().split("\\s+");
                StringBuilder suggestion = new StringBuilder();
                int wordCount = 0;
                for (String word : words) {
                    suggestion.append(word).append(" ");
                    wordCount++;
                    if (wordCount >= 3 || wordCount >= words.length) break;
                }
                completions.add(suggestion.toString().trim());
            }
        }

        // Ограничиваем до 5 слов в подсказке
        completions = completions.stream()
                .map(s -> {
                    String[] words = s.split("\\s+");
                    return String.join(" ", Arrays.copyOfRange(words, 0, Math.min(words.length, 5)));
                })
                .collect(Collectors.toCollection(LinkedHashSet::new));

        return completions;
    }

    @Override
    public void trackAnnouncementView(Long announcementId, User user, String visitorAddress) {
        log.info("Регистрация посещения объявления ID: {} пользователем: {}, адрес: {}",
                announcementId, user != null ? user.getEmail() : "неавторизован", visitorAddress);

        Announcement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new RuntimeException("Объявление не найдено"));

        // Не засчитываем просмотр, если пользователь — владелец объявления
        if (user != null && announcement.getUser() != null && user.getId().equals(announcement.getUser().getId())) {
            log.info("Просмотр объявления ID: {} владельцем {} не засчитывается",
                    announcementId, user.getEmail());
            return;
        }

        // Проверяем, посещал ли пользователь объявление в последние 60 секунд
        LocalDateTime recentThreshold = LocalDateTime.now().minusSeconds(60);
        boolean alreadyVisited = user != null &&
                announcementViewRepository.existsByAnnouncementAndUserAndVisitTimeAfter(
                        announcement, user, recentThreshold);

        if (alreadyVisited) {
            log.info("Посещение объявления ID: {} пользователем {} уже зарегистрировано, пропуск",
                    announcementId, user.getEmail());
            return;
        }

        // Определяем адрес: берем из User, если авторизован, иначе "Неизвестно"
        String addressToRecord = (user != null && user.getAddress() != null)
                ? user.getAddress()
                : "Неизвестно";

        // Создаем запись о посещении
        AnnouncementView view = AnnouncementView.builder()
                .announcement(announcement)
                .user(user)
                .visitTime(LocalDateTime.now())
                .visitorAddress(addressToRecord)
                .build();

        announcementViewRepository.save(view);

        // Обновляем счетчик просмотров (все посещения)
        long viewCount = announcementViewRepository.countByAnnouncement(announcement);
        announcement.setViews((int) viewCount);
        announcementRepository.save(announcement);
    }

    @Override
    public List<AnnouncementView> getAnnouncementViewsStats(Long announcementId, LocalDateTime start, LocalDateTime end) {
        log.info("Получение статистики посещений для объявления ID: {} с {} по {}", announcementId, start, end);
        Announcement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new RuntimeException("Объявление не найдено"));
        return announcementViewRepository.findByAnnouncementAndVisitTimeBetween(announcement, start, end);
    }

    @Override
    public long getUniqueVisitorCount(Long announcementId) {
        log.info("Получение количества уникальных посетителей для объявления ID: {}", announcementId);
        Announcement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new RuntimeException("Объявление не найдено"));
        return announcementViewRepository.countUniqueUsersByAnnouncement(announcement);
    }

    @Override
    public Map<User, Long> getVisitCountsByUser(Long announcementId) {
        log.info("Получение статистики посещений по пользователям для объявления ID: {}", announcementId);
        Announcement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new RuntimeException("Объявление не найдено"));
        List<Object[]> results = announcementViewRepository.findVisitCountsByUserForAnnouncement(announcement);
        Map<User, Long> visitCounts = new HashMap<>();
        for (Object[] result : results) {
            User user = (User) result[0];
            Long count = (Long) result[1];
            visitCounts.put(user, count);
        }
        return visitCounts;
    }

    @Override
    public Announcement publishAnnouncement(Long id, User user) {
        log.info("Публикация объявления с ID: {} для пользователя с email: {}", id, user.getEmail());
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(ERROR_NOT_FOUND));
        if (!announcement.getUser().getId().equals(user.getId())) {
            log.warn("Попытка публикации объявления с ID: {} пользователем без прав: {}", id, user.getEmail());
            throw new RuntimeException(ERROR_NOT_AUTHORIZED);
        }
        if (announcement.getStatus() != Announcement.Status.DRAFT) {
            throw new IllegalStateException("Только черновики могут быть опубликованы");
        }
        announcement.setStatus(determineStatus(announcement));
        announcement.setUpdatedAt(LocalDateTime.now());
        return announcementRepository.save(announcement);
    }

    @Override
    public Announcement restoreAnnouncement(Long id, User user) {
        log.info("Восстановление объявления с ID: {} для пользователя с email: {}", id, user.getEmail());
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(ERROR_NOT_FOUND));
        if (!announcement.getUser().getId().equals(user.getId())) {
            log.warn("Попытка восстановления объявления с ID: {} пользователем без прав: {}", id, user.getEmail());
            throw new RuntimeException(ERROR_NOT_AUTHORIZED);
        }
        if (announcement.getStatus() != Announcement.Status.ARCHIVED) {
            throw new IllegalStateException("Только архивированные объявления могут быть восстановлены");
        }
        announcement.setStatus(determineStatus(announcement));
        announcement.setUpdatedAt(LocalDateTime.now());
        return announcementRepository.save(announcement);
    }

    private Announcement.Status determineStatus(Announcement announcement) {
        if (announcement.getPrice() != null && announcement.getPrice().compareTo(BUSINESS_PRICE_THRESHOLD) > 0 ||
                announcement.getCondition() == Announcement.Condition.BUYSELL ||
                (announcement.getQuantity() != null && announcement.getQuantity() > BUSINESS_QUANTITY_THRESHOLD)) {
            return Announcement.Status.BUSINESS;
        }
        return Announcement.Status.ACTIVE;
    }
}