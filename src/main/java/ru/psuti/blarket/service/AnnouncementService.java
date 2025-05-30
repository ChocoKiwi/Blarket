package ru.psuti.blarket.service;

import ru.psuti.blarket.dto.AnnouncementDTO;
import ru.psuti.blarket.dto.CreateAnnouncementDTO;
import ru.psuti.blarket.dto.UpdateAnnouncementDTO;
import ru.psuti.blarket.model.Announcement;
import ru.psuti.blarket.model.User;

import java.util.List;

public interface AnnouncementService {
    Announcement createAnnouncement(CreateAnnouncementDTO dto, User user, boolean isDraft);
    Announcement updateAnnouncement(Long id, UpdateAnnouncementDTO dto, User user, boolean isDraft);
    void deleteAnnouncement(Long id, User user);
    void archiveAnnouncement(Long id, User user);
    Announcement publishAnnouncement(Long id, User user);
    Announcement restoreAnnouncement(Long id, User user);
    List<AnnouncementDTO> getAnnouncementsByUserAndStatus(User user, Announcement.Status status);
    Announcement getAnnouncementById(Long id, User user);
    List<AnnouncementDTO> getAnnouncementsByCategory(Long categoryId);
}