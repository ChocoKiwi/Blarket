package ru.psuti.blarket.repository.cart;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import ru.psuti.blarket.model.cart.Order;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    @Query("SELECT SUM(o.quantity) FROM Order o WHERE o.announcement.id = :announcementId")
    Integer sumQuantityByAnnouncementId(Long announcementId);
}