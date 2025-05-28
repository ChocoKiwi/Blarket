package ru.psuti.blarket.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.psuti.blarket.model.User;

import java.util.Optional;

/**
 * Репозиторий для работы с сущностью {@link User}.
 */
public interface UserRepository extends JpaRepository<User, Long> {
    /**
     * Находит пользователя по email.
     *
     * @param email адрес электронной почты
     * @return Optional с пользователем или пустой, если пользователь не найден
     */
    Optional<User> findByEmail(String email);

    /**
     * Проверяет существование пользователя с указанным email.
     *
     * @param email адрес электронной почты
     * @return true, если пользователь существует, иначе false
     */
    boolean existsByEmail(String email);
}