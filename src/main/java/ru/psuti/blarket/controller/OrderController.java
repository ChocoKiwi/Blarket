package ru.psuti.blarket.controller;

import jakarta.validation.Valid;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import ru.psuti.blarket.dto.cart.CartItemDTO;
import ru.psuti.blarket.model.user.User;
import ru.psuti.blarket.service.cart.OrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);
    private final OrderService orderService;

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CheckoutRequest request) {
        logger.info("Processing checkout for userId: {}", user.getId());
        try {
            orderService.checkout(user.getId(), request.getCartItems(), request.getFinalCost());
            return ResponseEntity.ok().body(new ResponseMessage("success", "Заказ успешно оформлен"));
        } catch (IllegalArgumentException | IllegalStateException e) {
            logger.error("Checkout failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ResponseMessage("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Server error during checkout: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(new ResponseMessage("error", "Ошибка сервера: " + e.getMessage()));
        }
    }

    @GetMapping("/purchased")
    public ResponseEntity<?> getPurchasedItems(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "popularity") String sort) {
        logger.info("Fetching purchased items for userId: {} with sort: {}", user.getId(), sort);
        try {
            List<CartItemDTO> purchasedItems = orderService.getPurchasedItems(user.getId(), sort);
            return ResponseEntity.ok(purchasedItems);
        } catch (Exception e) {
            logger.error("Error fetching purchased items: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(new ResponseMessage("error", "Ошибка сервера: " + e.getMessage()));
        }
    }

    @Setter
    @Getter
    static class CheckoutRequest {
        @jakarta.validation.constraints.NotNull(message = "Список товаров не может быть пустым")
        private List<CartItemDTO> cartItems;

        @jakarta.validation.constraints.NotNull(message = "Итоговая стоимость не может быть пустой")
        private Double finalCost;
    }

    @Getter
    @Setter
    static class ResponseMessage {
        private String status;
        private String message;

        public ResponseMessage(String status, String message) {
            this.status = status;
            this.message = message;
        }
    }
}