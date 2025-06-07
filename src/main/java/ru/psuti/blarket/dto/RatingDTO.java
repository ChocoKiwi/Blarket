package ru.psuti.blarket.dto;

import lombok.Data;
import ru.psuti.blarket.model.Rating;
import ru.psuti.blarket.util.ImageUrlUtil;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class RatingDTO {
    private Long id;
    private String title;
    private String description;
    private Integer stars;
    private List<String> imageUrls;
    private Long userId;
    private String userName;
    private String userAvatar;
    private String userType;
    private Long announcementId;
    private LocalDateTime createdAt;

    public static RatingDTO fromRating(Rating rating) {
        RatingDTO dto = new RatingDTO();
        dto.setId(rating.getId());
        dto.setTitle(rating.getTitle());
        dto.setDescription(rating.getDescription());
        dto.setStars(rating.getStars());
        dto.setImageUrls(ImageUrlUtil.parseImageUrlsToList(rating.getImageUrls()));
        dto.setUserId(rating.getUser().getId());
        dto.setUserName(rating.getUser().getName() != null ? rating.getUser().getName() : "Без имени");
        dto.setUserAvatar(rating.getUser().getAvatar());
        dto.setUserType(rating.getUser().getRoles().stream()
                .map(role -> role.name())
                .collect(Collectors.joining(", ")));
        dto.setAnnouncementId(rating.getAnnouncement().getId());
        dto.setCreatedAt(rating.getCreatedAt());
        return dto;
    }
}