// src/main/java/ru/psuti/blarket/dto/AnnouncementDTO.java
package ru.psuti.blarket.dto;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import ru.psuti.blarket.model.Announcement;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class AnnouncementDTO {
    private Long id;
    private String title;
    private String description;
    private BigDecimal price;
    private List<String> imageUrls;
    private String address;
    private Integer quantity;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer views;
    private Announcement.Condition condition;
    private Float rating;
    private Long categoryId;
    private String categoryName;
    private Announcement.Status status;
    private Long userId;
    private String authorName;

    private static final ObjectMapper objectMapper = new ObjectMapper();

    public static AnnouncementDTO fromAnnouncement(Announcement announcement) {
        AnnouncementDTO dto = new AnnouncementDTO();
        dto.setId(announcement.getId());
        dto.setUserId(announcement.getUser().getId());
        dto.setTitle(announcement.getTitle());
        dto.setDescription(announcement.getDescription());
        dto.setPrice(announcement.getPrice());
        // Обработка imageUrls
        List<String> imageUrls = parseImageUrls(announcement.getImageUrls());
        dto.setImageUrls(imageUrls);
        dto.setAddress(announcement.getAddress());
        dto.setQuantity(announcement.getQuantity() != null ? announcement.getQuantity() : 1);
        dto.setCreatedAt(announcement.getCreatedAt());
        dto.setUpdatedAt(announcement.getUpdatedAt());
        dto.setViews(announcement.getViews() != null ? announcement.getViews() : 0);
        dto.setCondition(announcement.getCondition());
        dto.setRating(announcement.getRating() != null ? announcement.getRating() : 0.0f);
        dto.setCategoryId(announcement.getCategory() != null ? announcement.getCategory().getId() : null);
        dto.setCategoryName(announcement.getCategory() != null ? announcement.getCategory().getName() : "Без категории");
        dto.setStatus(announcement.getStatus());
        dto.setAuthorName(announcement.getUser().getName() != null ? announcement.getUser().getName() : "Без имени");
        return dto;
    }

    private static List<String> parseImageUrls(String imageUrlsStr) {
        if (imageUrlsStr == null || imageUrlsStr.isEmpty()) {
            return Collections.emptyList();
        }
        try {
            // Попробуем разобрать как JSON
            List<String> urls = objectMapper.readValue(imageUrlsStr, new TypeReference<List<String>>(){});
            return urls.stream()
                    .filter(url -> url != null && url.startsWith("data:image/") && url.contains(";base64,"))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            // Если не JSON, разбиваем по запятым
            return Arrays.stream(imageUrlsStr.split(","))
                    .filter(url -> url != null && url.startsWith("data:image/") && url.contains(";base64,"))
                    .collect(Collectors.toList());
        }
    }
}