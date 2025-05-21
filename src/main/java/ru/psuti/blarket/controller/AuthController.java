package ru.psuti.blarket.controller;

import jakarta.servlet.http.HttpSession;
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

import java.util.Map;

@RestController
@RequestMapping("/api")
public class AuthController {
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
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Неавторизован"));
        }
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .map(user -> ResponseEntity.ok(Map.of(
                        "username", user.getUsername(),
                        "email", user.getEmail())))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Пользователь не найден")));
    }

    @PostMapping("/api/user/update")
    public ResponseEntity<?> updateUser(@RequestBody UserUpdateDTO updateDTO, Authentication authentication) {
        if (authentication == null || authentication instanceof AnonymousAuthenticationToken) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Неавторизован"));
        }

        String username = authentication.getName();
        try {
            userService.updateUser(username, updateDTO);
            return ResponseEntity.ok(Map.of("message", "Данные обновлены"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Пользователь не найден"));
        }
    }
}