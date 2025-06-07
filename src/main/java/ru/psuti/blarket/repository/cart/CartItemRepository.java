package ru.psuti.blarket.repository.cart;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.psuti.blarket.model.cart.CartItem;
import ru.psuti.blarket.model.user.User;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByUser(User user);
    List<CartItem> findByUserAndDeferred(User user, boolean deferred);
    void deleteByUserAndAnnouncementId(User user, Long announcementId);
    Optional<CartItem> findByUserAndAnnouncementId(User user, Long announcementId);
    void deleteByUser(User user);
}