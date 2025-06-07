package ru.psuti.blarket.dto.announcement;

import lombok.Data;
import ru.psuti.blarket.dto.RatingDTO;
import ru.psuti.blarket.model.announcement.Announcement;
import ru.psuti.blarket.model.Rating;
import ru.psuti.blarket.util.ImageUrlUtil;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class AnnouncementDTO {
    private Long id;
    private String title;
    private String description;
    private Double price;
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
    private Integer quantitySold;
    private List<RatingDTO> ratings;

    public static AnnouncementDTO fromAnnouncement(Announcement announcement) {
        AnnouncementDTO dto = new AnnouncementDTO();
        dto.setId(announcement.getId());
        dto.setUserId(announcement.getUser().getId());
        dto.setTitle(announcement.getTitle());
        dto.setDescription(announcement.getDescription());
        dto.setPrice(announcement.getPrice());
        dto.setImageUrls(ImageUrlUtil.parseImageUrlsToList(announcement.getImageUrls()));
        dto.setAddress(announcement.getAddress());
        dto.setQuantity(announcement.getQuantity() != null ? announcement.getQuantity() : 1);
        dto.setCreatedAt(announcement.getCreatedAt());
        dto.setUpdatedAt(announcement.getUpdatedAt());
        dto.setViews(announcement.getViews() != null ? announcement.getViews() : 0);
        dto.setCondition(announcement.getCondition());
        dto.setRating(calculateAverageRating(announcement));
        dto.setCategoryId(announcement.getCategory() != null ? announcement.getCategory().getId() : null);
        dto.setCategoryName(announcement.getCategory() != null ? announcement.getCategory().getName() : "Без категории");
        dto.setStatus(announcement.getStatus());
        dto.setAuthorName(announcement.getUser().getName() != null ? announcement.getUser().getName() : "Без имени");
        dto.setRatings(announcement.getRatings() != null
                ? announcement.getRatings().stream().map(RatingDTO::fromRating).collect(Collectors.toList())
                : Collections.emptyList());
        return dto;
    }

    private static Float calculateAverageRating(Announcement announcement) {
        if (announcement.getRatings() == null || announcement.getRatings().isEmpty()) {
            return 0.0f;
        }
        double average = announcement.getRatings().stream()
                .mapToInt(Rating::getStars)
                .average()
                .orElse(0.0);
        return (float) average;
    }
}