package ru.psuti.blarket.dto;

import lombok.Data;

@Data
public class TopUpRequestDTO {
    private Long userId;
    private double amount;
}