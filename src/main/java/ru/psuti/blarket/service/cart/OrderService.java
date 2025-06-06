// OrderService.java
package ru.psuti.blarket.service.cart;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.psuti.blarket.dto.cart.CartItemDTO;
import ru.psuti.blarket.model.announcement.Announcement;
import ru.psuti.blarket.model.cart.Order;
import ru.psuti.blarket.model.user.User;
import ru.psuti.blarket.model.Wallet;
import ru.psuti.blarket.repository.UserRepository;
import ru.psuti.blarket.repository.WalletRepository;
import ru.psuti.blarket.repository.announcement.AnnouncementRepository;
import ru.psuti.blarket.repository.cart.OrderRepository;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final AnnouncementRepository announcementRepository;
    private final WalletRepository walletRepository;
    private final CartService cartService;
    private final ObjectMapper objectMapper;

    @Transactional
    public void checkout(Long userId, List<CartItemDTO> cartItems) {
        if (cartItems == null || cartItems.isEmpty()) {
            throw new IllegalArgumentException("Корзина пуста");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));

        Wallet wallet = walletRepository.findByUserId(userId);
        if (wallet == null) {
            throw new IllegalStateException("Кошелёк не найден");
        }

        List<CartItemDTO> cartItemsToCheckout = cartItems.stream()
                .filter(item -> item.getItemStatus() == Order.ItemStatus.CART)
                .toList();

        if (cartItemsToCheckout.isEmpty()) {
            throw new IllegalArgumentException("Нет товаров в корзине для оформления");
        }

        double totalPrice = cartItemsToCheckout.stream()
                .mapToDouble(item -> (item.getPrice() != null ? item.getPrice() : 0) * item.getQuantity())
                .sum();

        if (wallet.getBalance() < totalPrice) {
            throw new IllegalStateException("Недостаточно средств на балансе: требуется " + totalPrice + " руб.");
        }

        for (CartItemDTO item : cartItemsToCheckout) {
            if (item.getQuantity() <= 0) {
                throw new IllegalArgumentException("Количество товара должно быть больше 0: " + item.getAnnouncementTitle());
            }

            Announcement announcement = announcementRepository.findById(item.getAnnouncementId())
                    .orElseThrow(() -> new IllegalArgumentException("Объявление не найдено: " + item.getAnnouncementTitle()));

            if (item.getQuantity() > announcement.getQuantity()) {
                throw new IllegalStateException("Недостаточно товара '" + item.getAnnouncementTitle() + "': доступно " + announcement.getQuantity() + " шт.");
            }

            announcement.setQuantity(announcement.getQuantity() - item.getQuantity());
            if (announcement.getQuantity() == 0) {
                announcement.setStatus(Announcement.Status.SOLD);
            }
            announcementRepository.save(announcement);

            // Проверка на существующий заказ
            Optional<Order> existingOrder = orderRepository.findByUserAndAnnouncement(user, announcement);
            if (existingOrder.isPresent()) {
                Order order = existingOrder.get();
                order.setQuantity(order.getQuantity() + item.getQuantity());
                order.setTotalPrice(order.getTotalPrice() + (item.getPrice() * item.getQuantity()));
                order.setCreatedAt(LocalDateTime.now());
                orderRepository.save(order);
            } else {
                Order order = Order.builder()
                        .user(user)
                        .announcement(announcement)
                        .quantity(item.getQuantity())
                        .totalPrice(item.getPrice() * item.getQuantity())
                        .status(Order.OrderStatus.COMPLETED)
                        .itemStatus(Order.ItemStatus.CART)
                        .createdAt(LocalDateTime.now())
                        .build();
                orderRepository.save(order);
            }
        }

        wallet.setBalance(wallet.getBalance() - totalPrice);
        walletRepository.save(wallet);

        cartService.clearCart(userId);
    }

    public List<CartItemDTO> getPurchasedItems(Long userId, String sort) {
        List<Order> orders = orderRepository.findPurchasedByUserId(userId);

        // Группировка по announcementId
        Map<Long, CartItemDTO> aggregatedItems = new HashMap<>();
        for (Order order : orders) {
            Long announcementId = order.getAnnouncement().getId();
            CartItemDTO dto = aggregatedItems.computeIfAbsent(announcementId, k -> {
                CartItemDTO newDto = new CartItemDTO();
                newDto.setId(order.getId());
                newDto.setAnnouncementId(announcementId);
                newDto.setAnnouncementTitle(order.getAnnouncement().getTitle());
                newDto.setPrice(order.getAnnouncement().getPrice());
                String imageUrlsJson = order.getAnnouncement().getImageUrls();
                String[] imageUrls = new String[0];
                if (imageUrlsJson != null) {
                    try {
                        imageUrls = objectMapper.readValue(imageUrlsJson, new TypeReference<String[]>() {});
                    } catch (Exception e) {
                        imageUrls = imageUrlsJson.split(",");
                    }
                }
                newDto.setImageUrl(imageUrls.length > 0 ? imageUrls[0] : null);
                newDto.setAvailableQuantity(order.getAnnouncement().getQuantity());
                newDto.setItemStatus(order.getAnnouncement().getQuantity() == 0 ? Order.ItemStatus.SOLD : order.getItemStatus());
                return newDto;
            });
            dto.setQuantity(dto.getQuantity() != null ? dto.getQuantity() + order.getQuantity() : order.getQuantity());
        }

        List<CartItemDTO> items = new ArrayList<>(aggregatedItems.values());

        // Применяем сортировку
        switch (sort != null ? sort.toLowerCase() : "popularity") {
            case "newest":
                items.sort(Comparator.comparing(CartItemDTO::getId, Comparator.reverseOrder()));
                break;
            case "expensive":
                items.sort(Comparator.comparing(CartItemDTO::getPrice, Comparator.reverseOrder()));
                break;
            case "cheapest":
                items.sort(Comparator.comparing(CartItemDTO::getPrice));
                break;
            case "rating":
            case "popularity":
            default:
                items.sort(Comparator.comparing(CartItemDTO::getId));
                break;
        }

        return items;
    }
}