package ru.psuti.blarket.dto.cart;

import lombok.Data;
import ru.psuti.blarket.model.cart.Order.ItemStatus;

@Data
public class CartItemDTO {
    private Long id;
    private Long announcementId;
    private String announcementTitle;
    private String imageUrl;
    private Double price;
    private Integer quantity;
    private Integer availableQuantity;
    private ItemStatus itemStatus; // Новое поле
}