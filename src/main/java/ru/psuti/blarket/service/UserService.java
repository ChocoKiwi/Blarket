package ru.psuti.blarket.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import ru.psuti.blarket.dto.UserRegistrationDTO;
import ru.psuti.blarket.dto.UserUpdateDTO;
import ru.psuti.blarket.model.User;
import ru.psuti.blarket.repository.UserRepository;

import java.util.Optional;

/**
 * Сервис для управления пользователями.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private static final String ERROR_EMAIL_EXISTS = "Пользователь с email %s уже зарегистрирован";
    private static final String ERROR_USER_NOT_FOUND = "Пользователь с email %s не найден";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Регистрирует нового пользователя.
     *
     * @param userDTO данные для регистрации
     * @throws IllegalArgumentException если email уже занят
     */
    public void registerUser(UserRegistrationDTO userDTO) {
        log.info("Регистрация пользователя с email: {}", userDTO.getEmail());
        if (userRepository.existsByEmail(userDTO.getEmail())) {
            throw new IllegalArgumentException(String.format(ERROR_EMAIL_EXISTS, userDTO.getEmail()));
        }
        User user = User.builder()
                .name(userDTO.getName())
                .password(passwordEncoder.encode(userDTO.getPassword()))
                .email(userDTO.getEmail())
                .build();
        userRepository.save(user);
        log.info("Пользователь с email {} успешно зарегистрирован", userDTO.getEmail());
    }

    /**
     * Обновляет данные пользователя.
     *
     * @param email    текущий email пользователя
     * @param updateDTO данные для обновления
     * @throws IllegalArgumentException если новый email уже занят
     * @throws UsernameNotFoundException если пользователь не найден
     */
    public void updateUser(String email, UserUpdateDTO updateDTO) {
        log.info("Обновление данных пользователя с email: {}", email);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(String.format(ERROR_USER_NOT_FOUND, email)));

        Optional.ofNullable(updateDTO.getEmail())
                .filter(newEmail -> !newEmail.equals(user.getEmail()))
                .ifPresent(newEmail -> {
                    if (userRepository.existsByEmail(newEmail)) {
                        throw new IllegalArgumentException(String.format(ERROR_EMAIL_EXISTS, newEmail));
                    }
                    user.setEmail(newEmail);
                    updateSecurityContext(newEmail);
                });

        Optional.ofNullable(updateDTO.getName()).ifPresent(user::setName);
        Optional.ofNullable(updateDTO.getGender()).ifPresent(user::setGender);
        Optional.ofNullable(updateDTO.getAddress()).ifPresent(user::setAddress);
        Optional.ofNullable(updateDTO.getPhoneNumber()).ifPresent(user::setPhoneNumber);
        Optional.ofNullable(updateDTO.getDateOfBirth()).ifPresent(user::setDateOfBirth);
        Optional.ofNullable(updateDTO.getAvatar()).ifPresent(user::setAvatar);

        userRepository.save(user);
        log.info("Данные пользователя с email {} успешно обновлены", email);
    }

    /**
     * Обновляет контекст безопасности при изменении email.
     *
     * @param newEmail новый email пользователя
     */
    private void updateSecurityContext(String newEmail) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            Authentication newAuth = new UsernamePasswordAuthenticationToken(
                    newEmail,
                    auth.getCredentials(),
                    auth.getAuthorities()
            );
            SecurityContextHolder.getContext().setAuthentication(newAuth);
        }
    }
}