package ru.psuti.blarket.dto;

import lombok.Data;
import ru.psuti.blarket.model.Announcement;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
public class UpdateAnnouncementDTO {
    private String title;
    private String description;
    private BigDecimal price;
    private Long categoryId;
    private List<String> imageUrls;
    private String city;
    private Map<String, Double> location;
    private Integer quantity;
    private Announcement.Status status;
    private Announcement.AdType adType;
    private Announcement.Condition itemCondition; // Изменено с condition
    private List<String> deliveryOptions;
}