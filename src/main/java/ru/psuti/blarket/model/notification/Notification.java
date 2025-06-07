package ru.psuti.blarket.model.notification;

import jakarta.persistence.*;
import lombok.*;
import ru.psuti.blarket.model.user.User;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @ManyToOne
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ElementCollection
    @CollectionTable(name = "notification_announcements", joinColumns = @JoinColumn(name = "notification_id"))
    @Column(name = "announcement_id")
    private List<Long> announcementIds;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private Double totalPrice;

    @Column(nullable = false)
    private String deliveryAddress;

    @Column(nullable = false)
    private String postalCode;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}