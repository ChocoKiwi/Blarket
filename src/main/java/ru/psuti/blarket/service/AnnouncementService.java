package ru.psuti.blarket.service;

import ru.psuti.blarket.dto.AnnouncementDTO;
import ru.psuti.blarket.dto.CreateAnnouncementDTO;
import ru.psuti.blarket.dto.UpdateAnnouncementDTO;
import ru.psuti.blarket.model.Announcement;
import ru.psuti.blarket.model.User;

import java.util.List;

/**
 * Сервис для управления объявлениями.
 */
public interface AnnouncementService {
    Announcement createAnnouncement(CreateAnnouncementDTO dto, User user);
    Announcement updateAnnouncement(Long id, UpdateAnnouncementDTO dto, User user);
    void deleteAnnouncement(Long id, User user);
    List<AnnouncementDTO> getAnnouncementsByUser(User user);
}