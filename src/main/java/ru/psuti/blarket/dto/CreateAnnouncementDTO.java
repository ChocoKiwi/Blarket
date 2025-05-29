package ru.psuti.blarket.dto;

import lombok.Data;
import ru.psuti.blarket.model.Announcement;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO для создания нового объявления.
 */
@Data
public class CreateAnnouncementDTO {
    private String title;
    private String description;
    private BigDecimal price;
    private List<String> imageUrls;
    private String address;
    private Integer quantity;
    private Announcement.Condition itemCondition;
    private List<String> deliveryOptions;
    private Long categoryId; // Добавлено поле для категории
}