package ru.psuti.blarket.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Сущность, представляющая объявление в системе.
 */
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

    @Column(length = 10485760)
    private String imageUrls;

    @Column(columnDefinition = "TEXT")
    private String address;

    private Integer quantity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonBackReference
    private User user;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private Integer views;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_condition")
    @JsonProperty("itemCondition")
    private Condition condition;

    private Float rating;

    /**
     * Перечисление для состояния товара.
     */
    public enum Condition {
        NEW, USED, BUYSELL
    }
}