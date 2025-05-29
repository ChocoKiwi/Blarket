package ru.psuti.blarket.dto;

import lombok.Data;
import ru.psuti.blarket.model.Announcement;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO для представления данных объявления.
 */
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
    private Long categoryId; // Добавлено поле для категории
    private String categoryName; // Для удобства возвращаем название категории
}