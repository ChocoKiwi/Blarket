package ru.psuti.blarket.service;

import lombok.RequiredArgsConstructor;
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

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public void registerUser(UserRegistrationDTO userDTO) {
        if (userRepository.existsByEmail(userDTO.getEmail())) {
            throw new IllegalArgumentException("Email уже зарегистрирован");
        }
        User user = User.builder()
                .name(userDTO.getName()) // Изменено с getUsername() на getName()
                .password(passwordEncoder.encode(userDTO.getPassword()))
                .email(userDTO.getEmail())
                .build();
        userRepository.save(user);
    }

    public void updateUser(String email, UserUpdateDTO updateDTO) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Пользователь не найден"));

        if (updateDTO.getEmail() != null && !updateDTO.getEmail().equals(user.getEmail()) && userRepository.existsByEmail(updateDTO.getEmail())) {
            throw new IllegalArgumentException("Email уже зарегистрирован");
        }

        if (updateDTO.getName() != null) user.setName(updateDTO.getName());
        if (updateDTO.getEmail() != null) {
            user.setEmail(updateDTO.getEmail());
            // Обновляем SecurityContext
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null) {
                Authentication newAuth = new UsernamePasswordAuthenticationToken(
                        updateDTO.getEmail(),
                        auth.getCredentials(),
                        auth.getAuthorities()
                );
                SecurityContextHolder.getContext().setAuthentication(newAuth);
            }
        }
        if (updateDTO.getGender() != null) user.setGender(updateDTO.getGender());
        if (updateDTO.getAddress() != null) user.setAddress(updateDTO.getAddress());
        if (updateDTO.getPhoneNumber() != null) user.setPhoneNumber(updateDTO.getPhoneNumber());
        if (updateDTO.getDateOfBirth() != null) user.setDateOfBirth(updateDTO.getDateOfBirth());
        if (updateDTO.getAvatar() != null) user.setAvatar(updateDTO.getAvatar());

        userRepository.save(user);
    }
}