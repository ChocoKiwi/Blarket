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
import org.springframework.web.bind.annotation.*;
import ru.psuti.blarket.dto.UserLoginDTO;
import ru.psuti.blarket.dto.UserRegistrationDTO;
import ru.psuti.blarket.dto.UserUpdateDTO;
import ru.psuti.blarket.repository.UserRepository;
import ru.psuti.blarket.service.UserService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class UserController {
    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/registration")
    public ResponseEntity<?> register(@RequestBody UserRegistrationDTO userDTO) {
        try {
            userService.registerUser(userDTO);
            return ResponseEntity.ok(Map.of("message", "Регистрация успешна"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserLoginDTO userDTO, HttpSession session) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(userDTO.getEmail(), userDTO.getPassword()));
            SecurityContextHolder.getContext().setAuthentication(authentication);
            session.setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());
            return ResponseEntity.ok(Map.of("message", "Успешный вход"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Неверный email или пароль"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        SecurityContextHolder.clearContext();
        session.invalidate();
        return ResponseEntity.ok(Map.of("message", "Вы вышли из системы"));
    }

    @GetMapping("/user/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication instanceof AnonymousAuthenticationToken) {
            logger.warn("Неавторизованный доступ к /user/me");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Неавторизован"));
        }
        String email = authentication.getName();
        logger.info("Запрос данных пользователя для email: {}", email);
        return userRepository.findByEmail(email)
                .map(user -> {
                    logger.info("Данные пользователя: name={}, email={}, gender={}, phoneNumber={}, dateOfBirth={}, address={}",
                            user.getName(), user.getEmail(), user.getGender(), user.getPhoneNumber(), user.getDateOfBirth(), user.getAddress());
                    Map<String, Object> userData = new HashMap<>();
                    userData.put("name", user.getName() != null ? user.getName() : "");
                    userData.put("email", user.getEmail() != null ? user.getEmail() : "");
                    userData.put("gender", user.getGender());
                    userData.put("phone", user.getPhoneNumber());
                    userData.put("date_of_birth", user.getDateOfBirth());
                    userData.put("address", user.getAddress());
                    userData.put("avatar", user.getAvatar());
                    return ResponseEntity.ok(userData);
                })
                .orElseGet(() -> {
                    logger.error("Пользователь с email {} не найден", email);
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(Map.of("message", "Пользователь не найден"));
                });
    }

    @PostMapping("/user/update")
    public ResponseEntity<?> updateUser(@RequestBody UserUpdateDTO updateDTO, Authentication authentication, HttpSession session) {
        if (authentication == null || authentication instanceof AnonymousAuthenticationToken) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Неавторизован"));
        }

        String email = authentication.getName();
        try {
            userService.updateUser(email, updateDTO);
            // Обновляем сессию
            session.setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());
            return ResponseEntity.ok(Map.of("message", "Данные обновлены"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Пользователь не найден"));
        }
    }
}