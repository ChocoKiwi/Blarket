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

import java.time.LocalDateTime;
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

    private final AnnouncementRepository announcementRepository;
    private final CategoryRepository categoryRepository;
    private final ObjectMapper objectMapper;

    @Override
    public Announcement createAnnouncement(CreateAnnouncementDTO dto, User user) {
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

    @Override
    public Announcement updateAnnouncement(Long id, UpdateAnnouncementDTO dto, User user) {
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

        announcement.setUpdatedAt(LocalDateTime.now());
        return announcementRepository.save(announcement);
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
    public List<AnnouncementDTO> getAnnouncementsByUser(User user) {
        log.info("Получение объявлений для пользователя с email: {}", user.getEmail());
        List<Announcement> announcements = announcementRepository.findByUser(user);
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
            return dto;
        }).collect(Collectors.toList());
    }
}