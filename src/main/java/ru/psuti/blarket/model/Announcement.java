package ru.psuti.blarket.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "announcements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Announcement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String description;
    private BigDecimal price;

    @Column(name = "image_urls", columnDefinition = "LONGTEXT")
    private String imageUrls;

    private String address;
    private Integer quantity;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", columnDefinition = "VARCHAR(20)")
    private Condition condition;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", columnDefinition = "VARCHAR(20)")
    private Status status;

    @ManyToOne
    private Category category;

    @ManyToOne
    private User user;

    @ElementCollection
    @CollectionTable(name = "announcement_delivery_options", joinColumns = @JoinColumn(name = "announcement_id"))
    @Column(name = "delivery_option")
    private List<String> deliveryOptions;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer views;
    private Float rating;

    public enum Condition {
        NEW, USED, BUYSELL
    }

    public enum Status {
        ACTIVE, BUSINESS, DRAFT, ARCHIVED
    }
}