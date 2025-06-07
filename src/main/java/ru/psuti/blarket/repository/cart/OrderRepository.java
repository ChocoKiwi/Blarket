package ru.psuti.blarket.repository.cart;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import ru.psuti.blarket.model.announcement.Announcement;
import ru.psuti.blarket.model.cart.Order;
import ru.psuti.blarket.model.user.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    @Query("SELECT SUM(o.quantity) FROM Order o WHERE o.announcement.id = :announcementId")
    Integer sumQuantityByAnnouncementId(Long announcementId);

    List<Order> findByUserId(Long userId);

    @Query("SELECT o FROM Order o WHERE o.user.id = :userId AND o.status = 'COMPLETED'")
    List<Order> findPurchasedByUserId(Long userId);

    Optional<Order> findByUserAndAnnouncement(User user, Announcement announcement);

    @Query("SELECT new ru.psuti.blarket.dto.cart.CartItemDTO(" +
            "MIN(o.id), o.announcement.id, o.announcement.title, o.announcement.price, " +
            "o.announcement.imageUrls, o.announcement.quantity, SUM(o.quantity)) " +
            "FROM Order o WHERE o.user.id = :userId AND o.status = 'COMPLETED' " +
            "GROUP BY o.announcement.id, o.announcement.title, o.announcement.price, " +
            "o.announcement.imageUrls, o.announcement.quantity")
    List<ru.psuti.blarket.dto.cart.CartItemDTO> findAggregatedPurchasedByUserId(Long userId);
}