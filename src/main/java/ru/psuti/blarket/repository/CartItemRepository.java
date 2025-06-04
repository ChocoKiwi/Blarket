package ru.psuti.blarket.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.psuti.blarket.model.cart.CartItem;
import ru.psuti.blarket.model.user.User;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByUser(User user);
    void deleteByUserAndAnnouncementId(User user, Long announcementId);

    Optional<CartItem> findByUserAndAnnouncementId(User user, Long announcementId);
}