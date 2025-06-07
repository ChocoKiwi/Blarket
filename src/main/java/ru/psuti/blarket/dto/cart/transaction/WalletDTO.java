package ru.psuti.blarket.dto.cart.transaction;

import lombok.Data;

@Data
public class WalletDTO {
    private Long userId;
    private double balance;
}