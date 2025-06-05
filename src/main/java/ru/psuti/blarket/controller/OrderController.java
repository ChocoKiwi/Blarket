package ru.psuti.blarket.controller;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import ru.psuti.blarket.dto.cart.CartItemDTO;
import ru.psuti.blarket.model.user.User;
import ru.psuti.blarket.service.cart.OrderService;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/checkout")
    public ResponseEntity<String> checkout(
            @AuthenticationPrincipal User user,
            @RequestBody CheckoutRequest request) {
        try {
            orderService.checkout(user.getId(), request.getCartItems());
            return ResponseEntity.ok("Заказ успешно оформлен");
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Ошибка сервера: " + e.getMessage());
        }
    }

    @Setter
    @Getter
    static class CheckoutRequest {
        private List<CartItemDTO> cartItems;

    }
}