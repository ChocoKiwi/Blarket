package ru.psuti.blarket.dto.cart;


import lombok.Data;

import java.math.BigDecimal;

@Data
public class CartItemDTO {
    private Long id;
    private Long announcementId;
    private String announcementTitle;
    private String imageUrl;
    private BigDecimal price;
    private Integer quantity;
    private Integer availableQuantity; // Новое поле
}