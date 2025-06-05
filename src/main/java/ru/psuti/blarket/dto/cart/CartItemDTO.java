package ru.psuti.blarket.dto.cart;


import lombok.Data;

import java.math.BigDecimal;

@Data
public class CartItemDTO {
    private Long id;
    private Long announcementId;
    private String announcementTitle;
    private String imageUrl;
    private Double price;
    private Integer quantity;
    private Integer availableQuantity; // Новое поле
}