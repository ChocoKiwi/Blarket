package ru.psuti.blarket.dto;

import lombok.Data;

import java.time.LocalDate;

/**
 * DTO для обновления данных пользователя.
 */
@Data
public class UserUpdateDTO {
    private String name;
    private String email;
    private String gender;
    private String address;
    private String phoneNumber;
    private LocalDate dateOfBirth;
    private String avatar;
}