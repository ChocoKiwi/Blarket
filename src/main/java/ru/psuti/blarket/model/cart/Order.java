package ru.psuti.blarket.model.cart;

import jakarta.persistence.*;
import lombok.*;
import ru.psuti.blarket.model.announcement.Announcement;
import ru.psuti.blarket.model.user.User;

import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    public enum OrderStatus {
        PENDING, COMPLETED, CANCELLED
    }

    public enum ItemStatus {
        CART, DEFERRED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "announcement_id", nullable = false)
    private Announcement announcement;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private Double totalPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_status", nullable = false)
    private ItemStatus itemStatus; // Новое поле для статуса товара

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}