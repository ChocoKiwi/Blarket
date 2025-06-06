package ru.psuti.blarket.service.cart;

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
import ru.psuti.blarket.util.ImageUrlUtil;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final AnnouncementRepository announcementRepository;
    private final WalletRepository walletRepository;
    private final CartService cartService;

    @Transactional
    public void checkout(Long userId, List<CartItemDTO> cartItems) {
        if (cartItems == null || cartItems.isEmpty()) {
            throw new IllegalArgumentException("Корзина пуста");
        }
        for (CartItemDTO item : cartItems) {
            if (item.getAnnouncementId() == null || item.getQuantity() == null || item.getPrice() == null) {
                throw new IllegalArgumentException("Некорректные данные товара: " + item.getAnnouncementTitle());
            }
            if (item.getQuantity() <= 0) {
                throw new IllegalArgumentException("Количество товара должно быть больше 0: " + item.getAnnouncementTitle());
            }
            if (item.isDeferred()) {
                throw new IllegalArgumentException("Отложенные товары не могут быть оформлены: " + item.getAnnouncementTitle());
            }
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));

        Wallet wallet = walletRepository.findByUserId(userId);
        if (wallet == null) {
            throw new IllegalStateException("Кошелёк не найден");
        }

        double totalPrice = cartItems.stream()
                .mapToDouble(item -> item.getPrice() * item.getQuantity())
                .sum();

        if (wallet.getBalance() < totalPrice) {
            throw new IllegalStateException("Недостаточно средств на балансе: требуется " + totalPrice + " руб.");
        }

        for (CartItemDTO item : cartItems) {
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

            Optional<Order> existingOrder = orderRepository.findByUserAndAnnouncement(user, announcement);
            Order order;
            if (existingOrder.isPresent()) {
                order = existingOrder.get();
                order.setQuantity(order.getQuantity() + item.getQuantity());
                order.setTotalPrice(order.getTotalPrice() + (item.getPrice() * item.getQuantity()));
                order.setCreatedAt(LocalDateTime.now());
            } else {
                order = Order.builder()
                        .user(user)
                        .announcement(announcement)
                        .quantity(item.getQuantity())
                        .totalPrice(item.getPrice() * item.getQuantity())
                        .status(Order.OrderStatus.COMPLETED)
                        .createdAt(LocalDateTime.now())
                        .build();
            }
            orderRepository.save(order);
        }

        wallet.setBalance(wallet.getBalance() - totalPrice);
        walletRepository.save(wallet);

        cartService.clearCart(userId);
    }

    public List<CartItemDTO> getPurchasedItems(Long userId, String sort) {
        List<CartItemDTO> items = orderRepository.findAggregatedPurchasedByUserId(userId);

        for (CartItemDTO item : items) {
            // Подтягиваем imageUrls из Announcement
            Announcement announcement = announcementRepository.findById(item.getAnnouncementId())
                    .orElseThrow(() -> new IllegalStateException("Объявление не найдено для ID: "));
            String imageUrls = announcement.getImageUrls();
            String[] parsedUrls = ImageUrlUtil.parseImageUrls(imageUrls);
            item.setImageUrl(parsedUrls.length > 0 ? parsedUrls[0] : null);
            item.setAvailableQuantity(item.getAvailableQuantity() == 0 ? 0 : item.getAvailableQuantity());
        }

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