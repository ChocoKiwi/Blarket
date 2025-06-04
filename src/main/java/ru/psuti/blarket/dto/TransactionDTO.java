package ru.psuti.blarket.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TransactionDTO {
    private Long id;
    private Long walletId;
    private double amount;
    private String status;
    private LocalDateTime createdAt;
}