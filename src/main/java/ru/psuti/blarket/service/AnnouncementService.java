package ru.psuti.blarket.service;

import ru.psuti.blarket.dto.CreateAnnouncementDTO;
import ru.psuti.blarket.dto.UpdateAnnouncementDTO;
import ru.psuti.blarket.model.Announcement;

public interface AnnouncementService {
    Announcement createAnnouncement(CreateAnnouncementDTO dto, Long userId);
    Announcement updateAnnouncement(Long id, UpdateAnnouncementDTO dto, Long userId);
    void deleteAnnouncement(Long id, Long userId);
}