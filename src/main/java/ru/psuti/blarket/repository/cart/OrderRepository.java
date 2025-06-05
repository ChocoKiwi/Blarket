package ru.psuti.blarket.repository.cart;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.psuti.blarket.model.cart.Order;
import ru.psuti.blarket.model.user.User;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUser(User user);
}