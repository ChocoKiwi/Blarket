package ru.psuti.blarket.model.cart;

import jakarta.persistence.*;
import lombok.*;
import ru.psuti.blarket.model.announcement.Announcement;
import ru.psuti.blarket.model.user.User;
import ru.psuti.blarket.model.cart.Order.ItemStatus;

@Entity
@Table(name = "cart_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItem {

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

    @Enumerated(EnumType.STRING)
    @Column(name = "item_status", nullable = false)
    private ItemStatus itemStatus = ItemStatus.CART; // Новое поле, по умолчанию CART
}