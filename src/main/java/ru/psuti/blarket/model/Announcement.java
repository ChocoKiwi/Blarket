package ru.psuti.blarket.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;

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

    @Column(nullable = true, length = 10485760)
    private String imageUrls;

    @Column(columnDefinition = "TEXT")
    private String address;

    private Integer quantity;

    private Long userId;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private Integer views;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_condition")
    @JsonProperty("itemCondition")
    private Condition condition;

    private Float rating;

    public enum Condition {
        NEW, USED, BUYSELL
    }
}