// AnnouncementViewRepository.java
package ru.psuti.blarket.repository.announcement;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import ru.psuti.blarket.model.announcement.Announcement;
import ru.psuti.blarket.model.announcement.AnnouncementView;
import ru.psuti.blarket.model.user.User;

import java.time.LocalDateTime;
import java.util.List;

public interface AnnouncementViewRepository extends JpaRepository<AnnouncementView, Long> {

    // Подсчет всех посещений для объявления
    long countByAnnouncement(Announcement announcement);

    // Подсчет уникальных пользователей для объявления
    @Query("SELECT COUNT(DISTINCT av.user) FROM AnnouncementView av WHERE av.announcement = :announcement AND av.user IS NOT NULL")
    long countUniqueUsersByAnnouncement(Announcement announcement);

    // Посещения за период для объявления
    List<AnnouncementView> findByAnnouncementAndVisitTimeBetween(
            Announcement announcement, LocalDateTime start, LocalDateTime end);

    // Посещения по объявлению и адресу
    List<AnnouncementView> findByAnnouncementAndVisitorAddress(
            Announcement announcement, String visitorAddress);

    // Проверка, посещал ли пользователь объявление
    boolean existsByAnnouncementAndUserAndVisitTimeAfter(
            Announcement announcement, User user, LocalDateTime threshold);

    // Статистика посещений по пользователям
    @Query("SELECT av.user, COUNT(av) FROM AnnouncementView av WHERE av.announcement = :announcement " +
            "AND av.user IS NOT NULL GROUP BY av.user")
    List<Object[]> findVisitCountsByUserForAnnouncement(Announcement announcement);
}