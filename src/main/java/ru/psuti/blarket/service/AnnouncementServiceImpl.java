// AnnouncementServiceImpl.java
package ru.psuti.blarket.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import ru.psuti.blarket.dto.AnnouncementDTO;
import ru.psuti.blarket.dto.CreateAnnouncementDTO;
import ru.psuti.blarket.dto.UpdateAnnouncementDTO;
import ru.psuti.blarket.model.Announcement;
import ru.psuti.blarket.model.Category;
import ru.psuti.blarket.model.User;
import ru.psuti.blarket.repository.AnnouncementRepository;
import ru.psuti.blarket.repository.CategoryRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

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

    @Override
    public Announcement createAnnouncement(CreateAnnouncementDTO dto, User user, boolean isDraft) {
        log.info("Создание объявления для пользователя с email: {}", user.getEmail());

        Category category = null;
        if (dto.getCategoryId() != null) {
            category = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new RuntimeException(ERROR_CATEGORY_NOT_FOUND));
        }

        Announcement announcement = Announcement.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .quantity(dto.getQuantity())
                .user(user)
                .address(dto.getAddress())
                .condition(dto.getItemCondition())
                .category(category)
                .deliveryOptions(dto.getDeliveryOptions())
                .createdAt(LocalDateTime.now())
                .status(isDraft ? Announcement.Status.DRAFT : determineStatus(dto))
                .build();

        Optional.ofNullable(dto.getImageUrls())
                .ifPresent(urls -> {
                    try {
                        announcement.setImageUrls(objectMapper.writeValueAsString(urls));
                    } catch (Exception e) {
                        log.error("Ошибка при преобразовании imageUrls: {}", e.getMessage(), e);
                        throw new RuntimeException(ERROR_IMAGE_URLS, e);
                    }
                });

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
        log.info("Обновление объявления с ID: {} для пользователя с email: {}", id, user.getEmail());
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(ERROR_NOT_FOUND));
        if (!announcement.getUser().getId().equals(user.getId())) {
            log.warn("Попытка обновления объявления с ID: {} пользователем без прав: {}", id, user.getEmail());
            throw new RuntimeException(ERROR_NOT_AUTHORIZED);
        }

        Optional.ofNullable(dto.getTitle()).ifPresent(announcement::setTitle);
        Optional.ofNullable(dto.getDescription()).ifPresent(announcement::setDescription);
        Optional.ofNullable(dto.getPrice()).ifPresent(announcement::setPrice);
        Optional.ofNullable(dto.getQuantity()).ifPresent(announcement::setQuantity);
        Optional.ofNullable(dto.getItemCondition()).ifPresent(announcement::setCondition);
        Optional.ofNullable(dto.getImageUrls()).ifPresent(urls -> {
            try {
                announcement.setImageUrls(objectMapper.writeValueAsString(urls));
            } catch (Exception e) {
                log.error("Ошибка при преобразовании imageUrls: {}", e.getMessage(), e);
                throw new RuntimeException(ERROR_IMAGE_URLS, e);
            }
        });
        Optional.ofNullable(dto.getDeliveryOptions()).ifPresent(announcement::setDeliveryOptions);

        if (dto.getCategoryId() != null) {
            Category category = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new RuntimeException(ERROR_CATEGORY_NOT_FOUND));
            announcement.setCategory(category);
        } else {
            announcement.setCategory(null);
        }

        announcement.setStatus(isDraft ? Announcement.Status.DRAFT : determineStatus(dto));
        announcement.setUpdatedAt(LocalDateTime.now());
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
            // Поддержка множественных статусов через параметр запроса
            String[] statuses = {"ACTIVE", "BUSINESS"};
            announcements = announcementRepository.findByUserAndStatusIn(user, Arrays.stream(statuses)
                    .map(Announcement.Status::valueOf)
                    .collect(Collectors.toList()));
        } else {
            announcements = announcementRepository.findByUserAndStatus(user, status);
        }
        return announcements.stream().map(announcement -> {
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
            dto.setStatus(announcement.getStatus());
            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    public Announcement getAnnouncementById(Long id, User user) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Объявление не найдено"));
        if (!announcement.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Доступ запрещен");
        }
        return announcement;
    }

    @Override
    public List<AnnouncementDTO> getAnnouncementsByCategory(Long categoryId) {
        log.info("Получение объявлений для категории с ID: {}", categoryId);
        categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException(ERROR_CATEGORY_NOT_FOUND));
        List<Announcement> announcements = announcementRepository.findByCategoryIdOrSubCategories(categoryId);
        return announcements.stream().map(announcement -> {
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
            dto.setStatus(announcement.getStatus());
            return dto;
        }).collect(Collectors.toList());
    }
}