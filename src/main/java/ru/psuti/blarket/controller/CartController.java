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
import ru.psuti.blarket.service.cart.CartService;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<?> getCart(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) Boolean deferred) {
        try {
            List<CartItemDTO> items = cartService.getCartItems(user.getId(), deferred);
            return ResponseEntity.ok(items);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ResponseMessage("error", e.getMessage()));
        }
    }

    @PostMapping("/add")
    public ResponseEntity<?> addToCart(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CartRequest request) {
        try {
            CartItemDTO item = cartService.addToCart(user.getId(), request.getAnnouncementId(), request.getQuantity(), request.isDeferred());
            return ResponseEntity.ok(item);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ResponseMessage("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{cartItemId}")
    public ResponseEntity<?> removeFromCart(
            @AuthenticationPrincipal User user,
            @PathVariable Long cartItemId) {
        try {
            cartService.removeFromCart(cartItemId, user.getId());
            return ResponseEntity.ok().body(new ResponseMessage("success", "Товар удалён из корзины"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ResponseMessage("error", e.getMessage()));
        }
    }

    @PutMapping("/{cartItemId}")
    public ResponseEntity<?> updateCartItemQuantity(
            @AuthenticationPrincipal User user,
            @PathVariable Long cartItemId,
            @Valid @RequestBody CartRequest request) {
        try {
            CartItemDTO item = cartService.updateCartItemQuantity(cartItemId, user.getId(), request.getQuantity());
            return ResponseEntity.ok(item);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ResponseMessage("error", e.getMessage()));
        }
    }

    @PutMapping("/defer/{cartItemId}")
    public ResponseEntity<?> deferCartItem(
            @AuthenticationPrincipal User user,
            @PathVariable Long cartItemId,
            @RequestParam boolean defer) {
        try {
            CartItemDTO item = cartService.deferCartItem(cartItemId, user.getId(), defer);
            return ResponseEntity.ok(item);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ResponseMessage("error", e.getMessage()));
        }
    }

    @Setter
    @Getter
    static class CartRequest {
        @jakarta.validation.constraints.NotNull(message = "ID объявления не может быть пустым")
        private Long announcementId;

        @jakarta.validation.constraints.NotNull(message = "Количество не может быть пустым")
        @jakarta.validation.constraints.Positive(message = "Количество должно быть больше 0")
        private Integer quantity;

        private boolean deferred = false; // По умолчанию корзина
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