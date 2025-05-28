package ru.psuti.blarket.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.psuti.blarket.model.Announcement;
import ru.psuti.blarket.model.User;

import java.util.List;

/**
 * Репозиторий для работы с сущностью {@link Announcement}.
 */
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    /**
     * Находит все объявления, связанные с указанным пользователем.
     *
     * @param user пользователь
     * @return список объявлений
     */
    List<Announcement> findByUser(User user);
}