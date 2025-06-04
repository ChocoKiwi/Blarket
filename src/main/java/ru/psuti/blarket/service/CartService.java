package ru.psuti.blarket.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ru.psuti.blarket.dto.cart.CartItemDTO;
import ru.psuti.blarket.model.announcement.Announcement;
import ru.psuti.blarket.model.cart.CartItem;
import ru.psuti.blarket.model.user.User;
import ru.psuti.blarket.repository.CartItemRepository;
import ru.psuti.blarket.repository.UserRepository;
import ru.psuti.blarket.repository.announcement.AnnouncementRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final AnnouncementRepository announcementRepository;

    public List<CartItemDTO> getCartItems(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        List<CartItem> items = cartItemRepository.findByUser(user);
        return items.stream()
                .filter(item -> item.getAnnouncement() != null)
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private CartItemDTO toDTO(CartItem item) {
        CartItemDTO dto = new CartItemDTO();
        dto.setId(item.getId());
        dto.setAnnouncementId(item.getAnnouncement().getId());
        dto.setAnnouncementTitle(item.getAnnouncement().getTitle());
        dto.setPrice(item.getAnnouncement().getPrice());
        String[] imageUrls = item.getAnnouncement().getImageUrls() != null
                ? item.getAnnouncement().getImageUrls().split(",")
                : new String[0];
        dto.setImageUrl(imageUrls.length > 0 ? imageUrls[0] : null);
        dto.setQuantity(item.getQuantity());
        dto.setAvailableQuantity(item.getAnnouncement().getQuantity()); // Устанавливаем доступное количество
        return dto;
    }

    public CartItemDTO updateCartItemQuantity(Long cartItemId, Long userId, Integer newQuantity) {
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Элемент корзины не найден"));
        if (!cartItem.getUser().getId().equals(userId)) {
            throw new RuntimeException("Доступ запрещен");
        }
        if (newQuantity <= 0) {
            throw new RuntimeException("Количество должно быть больше 0");
        }
        if (newQuantity > cartItem.getAnnouncement().getQuantity()) {
            throw new RuntimeException("Запрошенное количество превышает доступное: " + cartItem.getAnnouncement().getQuantity());
        }
        cartItem.setQuantity(newQuantity);
        return toDTO(cartItemRepository.save(cartItem));
    }

    public CartItemDTO addToCart(Long userId, Long announcementId, Integer quantity) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        Announcement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new RuntimeException("Объявление не найдено"));

        if (quantity <= 0) {
            throw new RuntimeException("Количество должно быть больше 0");
        }

        // Проверяем доступное количество в объявлении
        if (quantity > announcement.getQuantity()) {
            throw new RuntimeException("Запрошенное количество превышает доступное: " + announcement.getQuantity());
        }

        CartItem cartItem = cartItemRepository.findByUserAndAnnouncementId(user, announcementId)
                .orElse(CartItem.builder()
                        .user(user)
                        .announcement(announcement)
                        .quantity(0)
                        .build());

        // Проверяем, чтобы общее количество в корзине не превышало доступное
        int newQuantity = cartItem.getQuantity() + quantity;
        if (newQuantity > announcement.getQuantity()) {
            throw new RuntimeException("Общее количество в корзине не может превышать: " + announcement.getQuantity());
        }

        cartItem.setQuantity(newQuantity);
        return toDTO(cartItemRepository.save(cartItem));
    }

    public void removeFromCart(Long cartItemId, Long userId) {
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Элемент корзины не найден"));
        if (!cartItem.getUser().getId().equals(userId)) {
            throw new RuntimeException("Доступ запрещен");
        }
        cartItemRepository.deleteById(cartItemId);
    }
}