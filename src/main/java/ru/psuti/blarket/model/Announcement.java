package ru.psuti.blarket.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "announcements")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Announcement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private BigDecimal price;

    private Long categoryId;

    @Column(nullable = true, length = 10485760)
    private String imageUrls;

    @Column(columnDefinition = "TEXT")
    private String location;

    private Integer quantity;

    private Long userId;

    @Enumerated(EnumType.STRING)
    private Status status;

    @Enumerated(EnumType.STRING)
    private AdType adType;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private Integer views;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_condition") // Изменено с condition на item_condition
    private Condition condition;

    private Float rating;

    public enum Status {
        ACTIVE, DRAFT, ARCHIVED
    }

    public enum AdType {
        FREE, REGULAR, BUSINESS
    }

    public enum Condition {
        NEW, USED, BUYSELL // Обновлено, чтобы соответствовать фронтенду
    }
}