package ru.psuti.blarket.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import ru.psuti.blarket.dto.UserRegistrationDTO;
import ru.psuti.blarket.model.User;
import ru.psuti.blarket.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public void registerUser(UserRegistrationDTO userDTO) {
        if (userRepository.existsByEmail(userDTO.getEmail())) {
            throw new IllegalArgumentException("Email уже зарегистрирован");
        }
        if (userRepository.findByUsername(userDTO.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Имя пользователя уже занято");
        }

        User user = User.builder()
                .username(userDTO.getUsername()) // Имя пользователя
                .password(passwordEncoder.encode(userDTO.getPassword()))
                .email(userDTO.getEmail()) // Почта для аутентификации
                .build();

        userRepository.save(user);
    }
}