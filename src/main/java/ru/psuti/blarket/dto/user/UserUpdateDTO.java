package ru.psuti.blarket.dto.user;

import lombok.Data;
import ru.psuti.blarket.model.user.Role;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

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
    private List<Role> roles = new ArrayList<>();
}