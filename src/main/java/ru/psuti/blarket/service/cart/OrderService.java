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

import java.time.LocalDateTime;
import java.util.List;

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

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));

        Wallet wallet = walletRepository.findByUserId(userId);
        if (wallet == null) {
            throw new IllegalStateException("Кошелёк не найден");
        }

        // Рассчитываем общую стоимость
        double totalPrice = cartItems.stream()
                .mapToDouble(item -> (item.getPrice() != null ? item.getPrice() : 0) * item.getQuantity())
                .sum();

        // Проверяем баланс
        if (wallet.getBalance() < totalPrice) {
            throw new IllegalStateException("Недостаточно средств на балансе: требуется " + totalPrice + " руб.");
        }

        // Проверяем и обновляем товары
        for (CartItemDTO item : cartItems) {
            if (item.getQuantity() <= 0) {
                throw new IllegalArgumentException("Количество товара должно быть больше 0: " + item.getAnnouncementTitle());
            }

            Announcement announcement = announcementRepository.findById(item.getAnnouncementId())
                    .orElseThrow(() -> new IllegalArgumentException("Объявление не найдено: " + item.getAnnouncementTitle()));

            if (item.getQuantity() > announcement.getQuantity()) {
                throw new IllegalStateException("Недостаточно товара '" + item.getAnnouncementTitle() + "': доступно " + announcement.getQuantity() + " шт.");
            }

            // Уменьшаем количество в объявлении
            announcement.setQuantity(announcement.getQuantity() - item.getQuantity());

            // Устанавливаем статус SOLD, если количество стало 0
            if (announcement.getQuantity() == 0) {
                announcement.setStatus(Announcement.Status.SOLD);
            }

            announcementRepository.save(announcement);

            // Создаём заказ
            Order order = Order.builder()
                    .user(user)
                    .announcement(announcement)
                    .quantity(item.getQuantity())
                    .totalPrice(item.getPrice() * item.getQuantity())
                    .status(Order.OrderStatus.COMPLETED)
                    .createdAt(LocalDateTime.now())
                    .build();
            orderRepository.save(order);
        }

        // Списываем средства
        wallet.setBalance(wallet.getBalance() - totalPrice);
        walletRepository.save(wallet);

        // Очищаем корзину
        cartService.clearCart(userId);
    }
}