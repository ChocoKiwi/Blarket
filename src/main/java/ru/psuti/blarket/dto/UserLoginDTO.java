package ru.psuti.blarket.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO для входа пользователя в систему.
 */
@Data
public class UserLoginDTO {

    @NotBlank(message = "Email обязателен")
    @Email(message = "Неверный формат email")
    private String email;

    @NotBlank(message = "Пароль обязателен")
    private String password;
}