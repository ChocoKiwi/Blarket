package ru.psuti.blarket.dto;

import lombok.Data;

@Data
public class WalletDTO {
    private Long userId;
    private double balance;
}