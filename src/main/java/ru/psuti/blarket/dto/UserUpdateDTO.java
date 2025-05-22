package ru.psuti.blarket.dto;

import java.time.LocalDate;
import lombok.Data;

@Data
public class UserUpdateDTO {
    private String name; // Переименовано из username
    private String email;
    private String gender;
    private String address;
    private String phoneNumber;
    private LocalDate dateOfBirth;
    private String avatar; // Поле для Base64 строки изображения
}