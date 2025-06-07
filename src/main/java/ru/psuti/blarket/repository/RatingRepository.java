package ru.psuti.blarket.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.psuti.blarket.model.Rating;
import ru.psuti.blarket.model.announcement.Announcement;
import ru.psuti.blarket.model.user.User;

import java.util.List;
import java.util.Optional;

public interface RatingRepository extends JpaRepository<Rating, Long> {
    List<Rating> findByAnnouncement(Announcement announcement);
    Optional<Rating> findByAnnouncementAndUser(Announcement announcement, User user);
}