package ru.psuti.blarket.dto.user;

import lombok.Data;
import ru.psuti.blarket.model.user.Role;

import java.util.ArrayList;
import java.util.List;

/**
 * DTO для регестрации нового пользователя.
 */
@Data
public class UserRegistrationDTO {
    private String name;
    private String password;
    private String email;
    private List<Role> roles = new ArrayList<>();
}