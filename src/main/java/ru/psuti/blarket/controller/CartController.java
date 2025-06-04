package ru.psuti.blarket.controller;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import ru.psuti.blarket.dto.cart.CartItemDTO;
import ru.psuti.blarket.model.user.User;
import ru.psuti.blarket.service.CartService;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<List<CartItemDTO>> getCart(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(cartService.getCartItems(user.getId()));
    }

    @PostMapping("/add")
    public ResponseEntity<CartItemDTO> addToCart(
            @AuthenticationPrincipal User user,
            @RequestBody CartRequest request) {
        return ResponseEntity.ok(cartService.addToCart(user.getId(), request.getAnnouncementId(), request.getQuantity()));
    }

    @DeleteMapping("/{cartItemId}")
    public ResponseEntity<Void> removeFromCart(
            @AuthenticationPrincipal User user,
            @PathVariable Long cartItemId) {
        cartService.removeFromCart(cartItemId, user.getId());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{cartItemId}")
    public ResponseEntity<CartItemDTO> updateCartItemQuantity(
            @AuthenticationPrincipal User user,
            @PathVariable Long cartItemId,
            @RequestBody CartRequest request) {
        return ResponseEntity.ok(cartService.updateCartItemQuantity(cartItemId, user.getId(), request.getQuantity()));
    }

    @Setter
    @Getter
    static class CartRequest {
        private Long announcementId;
        private Integer quantity;

    }
}