package ru.psuti.blarket.controller;

import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;
import ru.psuti.blarket.dto.UserLoginDTO;
import ru.psuti.blarket.dto.UserRegistrationDTO;
import ru.psuti.blarket.dto.UserUpdateDTO;
import ru.psuti.blarket.repository.UserRepository;
import ru.psuti.blarket.service.UserService;

import java.util.HashMap;
import java.util.Map;

/**
 * Контроллер для управления пользователями (регистрация, вход, выход, обновление данных).
 */
@RestController
@RequestMapping("/api")
public class UserController {

    private static final Logger LOGGER = LoggerFactory.getLogger(UserController.class);
    private static final String SUCCESS_REGISTRATION = "Регистрация успешна";
    private static final String SUCCESS_LOGIN = "Успешный вход";
    private static final String SUCCESS_LOGOUT = "Вы вышли из системы";
    private static final String SUCCESS_UPDATE = "Данные обновлены";
    private static final String ERROR_UNAUTHORIZED = "Неавторизован";
    private static final String ERROR_INVALID_CREDENTIALS = "Неверный email или пароль";
    private static final String ERROR_USER_NOT_FOUND = "Пользователь не найден";

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserDetailsService userDetailsService;

    /**
     * Регистрирует нового пользователя.
     */
    @PostMapping("/registration")
    public ResponseEntity<Map<String, String>> register(@RequestBody UserRegistrationDTO userDTO) {
        try {
            userService.registerUser(userDTO);
            return ResponseEntity.ok(Map.of("message", SUCCESS_REGISTRATION));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Выполняет вход пользователя в систему.
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody UserLoginDTO userDTO, HttpSession session) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(userDTO.getEmail(), userDTO.getPassword()));
            SecurityContextHolder.getContext().setAuthentication(authentication);
            session.setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());
            return ResponseEntity.ok(Map.of("message", SUCCESS_LOGIN));
        } catch (Exception e) {
            LOGGER.warn("Ошибка входа для email: {}", userDTO.getEmail(), e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", ERROR_INVALID_CREDENTIALS));
        }
    }

    /**
     * Выполняет выход пользователя из системы.
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpSession session) {
        SecurityContextHolder.clearContext();
        session.invalidate();
        return ResponseEntity.ok(Map.of("message", SUCCESS_LOGOUT));
    }

    /**
     * Возвращает данные текущего авторизованного пользователя.
     */
    @GetMapping("/user/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication instanceof AnonymousAuthenticationToken) {
            LOGGER.warn("Неавторизованный доступ к /user/me");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }

        String email = authentication.getName();
        LOGGER.info("Запрос данных пользователя для email: {}", email);
        return userRepository.findByEmail(email)
                .map(user -> {
                    LOGGER.info("Данные пользователя: id={}, name={}, email={}, gender={}, phoneNumber={}, dateOfBirth={}, address={}, roles={}",
                            user.getId(), user.getName(), user.getEmail(), user.getGender(), user.getPhoneNumber(), user.getDateOfBirth(), user.getAddress(), user.getRoles());
                    Map<String, Object> userData = new HashMap<>();
                    userData.put("id", user.getId()); // Добавляем id
                    userData.put("name", user.getName() != null ? user.getName() : "");
                    userData.put("email", user.getEmail() != null ? user.getEmail() : "");
                    userData.put("gender", user.getGender());
                    userData.put("phone", user.getPhoneNumber());
                    userData.put("date_of_birth", user.getDateOfBirth());
                    userData.put("address", user.getAddress());
                    userData.put("avatar", user.getAvatar());
                    userData.put("roles", user.getRoles());
                    return ResponseEntity.ok(userData);
                })
                .orElseGet(() -> {
                    LOGGER.error("Пользователь с email {} не найден", email);
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(Map.of("message", ERROR_USER_NOT_FOUND));
                });
    }

    /**
     * Обновляет данные текущего пользователя.
     */
    @PostMapping("/user/update")
    public ResponseEntity<?> updateUser(@RequestBody UserUpdateDTO updateDTO, Authentication authentication, HttpSession session) {
        if (authentication == null || authentication instanceof AnonymousAuthenticationToken) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }

        String email = authentication.getName();
        try {
            userService.updateUser(email, updateDTO);
            String newEmail = updateDTO.getEmail() != null ? updateDTO.getEmail() : email;
            UserDetails updatedUserDetails = userDetailsService.loadUserByUsername(newEmail);
            Authentication newAuth = new UsernamePasswordAuthenticationToken(
                    updatedUserDetails, authentication.getCredentials(), updatedUserDetails.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(newAuth);
            session.setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());
            return ResponseEntity.ok(Map.of("message", SUCCESS_UPDATE, "newEmail", newEmail));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            LOGGER.error("Ошибка обновления пользователя с email: {}", email, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", ERROR_USER_NOT_FOUND));
        }
    }
}