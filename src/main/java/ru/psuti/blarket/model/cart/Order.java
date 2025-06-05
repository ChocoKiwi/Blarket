package ru.psuti.blarket.model.cart;

import jakarta.persistence.*;
import lombok.*;
import ru.psuti.blarket.model.announcement.Announcement;
import ru.psuti.blarket.model.user.User;

import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) // Ленивая загрузка для оптимизации
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY) // Ленивая загрузка
    @JoinColumn(name = "announcement_id", nullable = false)
    private Announcement announcement;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private Double totalPrice; // Изменено на Double для соответствия Wallet

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public enum OrderStatus {
        PENDING, COMPLETED, CANCELLED
    }
}