package ru.psuti.blarket.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import ru.psuti.blarket.dto.UserRegistrationDTO;
import ru.psuti.blarket.dto.UserUpdateDTO;
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
                .username(userDTO.getUsername())
                .password(passwordEncoder.encode(userDTO.getPassword()))
                .email(userDTO.getEmail())
                .build();
        userRepository.save(user);
    }

    public void updateUser(String username, UserUpdateDTO updateDTO) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Пользователь не найден"));

        if (updateDTO.getUsername() != null && !updateDTO.getUsername().equals(user.getUsername()) && userRepository.findByUsername(updateDTO.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Имя пользователя уже занято");
        }
        if (updateDTO.getEmail() != null && !updateDTO.getEmail().equals(user.getEmail()) && userRepository.existsByEmail(updateDTO.getEmail())) {
            throw new IllegalArgumentException("Email уже зарегистрирован");
        }

        if (updateDTO.getUsername() != null) user.setUsername(updateDTO.getUsername());
        if (updateDTO.getEmail() != null) user.setEmail(updateDTO.getEmail());
        if (updateDTO.getGender() != null) user.setGender(updateDTO.getGender());
        if (updateDTO.getAddress() != null) user.setAddress(updateDTO.getAddress());
        if (updateDTO.getPhoneNumber() != null) user.setPhoneNumber(updateDTO.getPhoneNumber());
        if (updateDTO.getDateOfBirth() != null) user.setDateOfBirth(updateDTO.getDateOfBirth());

        userRepository.save(user);
    }
}