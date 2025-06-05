package ru.psuti.blarket.repository.cart;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import ru.psuti.blarket.model.cart.Order;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    @Query("SELECT SUM(o.quantity) FROM Order o WHERE o.announcement.id = :announcementId")
    Integer sumQuantityByAnnouncementId(Long announcementId);

    List<Order> findByUserId(Long userId);

    List<Order> findByUserIdAndItemStatus(Long userId, Order.ItemStatus itemStatus);

    @Query("SELECT o FROM Order o WHERE o.user.id = :userId AND o.status = 'COMPLETED'")
    List<Order> findPurchasedByUserId(Long userId);
}