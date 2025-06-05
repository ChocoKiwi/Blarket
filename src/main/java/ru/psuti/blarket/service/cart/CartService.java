package ru.psuti.blarket.service.cart;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ru.psuti.blarket.dto.cart.CartItemDTO;
import ru.psuti.blarket.model.announcement.Announcement;
import ru.psuti.blarket.model.cart.CartItem;
import ru.psuti.blarket.model.user.User;
import ru.psuti.blarket.model.cart.Order.ItemStatus;
import ru.psuti.blarket.repository.cart.CartItemRepository;
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
    private final ObjectMapper objectMapper; // Добавляем ObjectMapper

    public List<CartItemDTO> getCartItems(Long userId, ItemStatus itemStatus) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        List<CartItem> items = itemStatus == null
                ? cartItemRepository.findByUser(user)
                : cartItemRepository.findByUserAndItemStatus(user, itemStatus);
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

        String imageUrlsJson = item.getAnnouncement().getImageUrls();
        String[] imageUrls = new String[0];
        if (imageUrlsJson != null) {
            try {
                imageUrls = objectMapper.readValue(imageUrlsJson, new TypeReference<String[]>() {});
            } catch (Exception e) {
                // Если JSON некорректен, пробуем split как запасной вариант
                imageUrls = imageUrlsJson.split(",");
            }
        }
        dto.setImageUrl(imageUrls.length > 0 ? imageUrls[0] : null);

        dto.setQuantity(item.getQuantity());
        dto.setAvailableQuantity(item.getAnnouncement().getQuantity());
        dto.setItemStatus(item.getItemStatus());
        return dto;
    }

    public void clearCart(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        List<CartItem> cartItems = cartItemRepository.findByUserAndItemStatus(user, ItemStatus.CART);
        cartItemRepository.deleteAll(cartItems);
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

    public CartItemDTO addToCart(Long userId, Long announcementId, Integer quantity, ItemStatus itemStatus) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        Announcement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new RuntimeException("Объявление не найдено"));

        if (quantity <= 0) {
            throw new RuntimeException("Количество должно быть больше 0");
        }

        if (quantity > announcement.getQuantity()) {
            throw new RuntimeException("Запрошенное количество превышает доступное: " + announcement.getQuantity());
        }

        CartItem cartItem = cartItemRepository.findByUserAndAnnouncementId(user, announcementId)
                .orElse(CartItem.builder()
                        .user(user)
                        .announcement(announcement)
                        .quantity(0)
                        .itemStatus(itemStatus)
                        .build());

        int newQuantity = cartItem.getQuantity() + quantity;
        if (newQuantity > announcement.getQuantity()) {
            throw new RuntimeException("Общее количество в корзине не может превышать: " + announcement.getQuantity());
        }

        cartItem.setQuantity(newQuantity);
        cartItem.setItemStatus(itemStatus);
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

    public CartItemDTO deferCartItem(Long cartItemId, Long userId, boolean defer) {
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Элемент корзины не найден"));
        if (!cartItem.getUser().getId().equals(userId)) {
            throw new RuntimeException("Доступ запрещен");
        }
        cartItem.setItemStatus(defer ? ItemStatus.DEFERRED : ItemStatus.CART);
        return toDTO(cartItemRepository.save(cartItem));
    }
}