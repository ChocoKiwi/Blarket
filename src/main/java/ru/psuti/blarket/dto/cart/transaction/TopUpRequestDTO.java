package ru.psuti.blarket.dto.cart.transaction;

import lombok.Data;

@Data
public class TopUpRequestDTO {
    private Long userId;
    private double amount;
}