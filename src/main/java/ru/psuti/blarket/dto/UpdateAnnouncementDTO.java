package ru.psuti.blarket.dto;

import lombok.Data;
import ru.psuti.blarket.model.Announcement;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO для обновления объявления.
 */
@Data
public class UpdateAnnouncementDTO {
    private String title;
    private String description;
    private BigDecimal price;
    private Long categoryId;
    private List<String> imageUrls;
    private String city;
    private Integer quantity;
    private Announcement.Condition itemCondition;
    private List<String> deliveryOptions;
}