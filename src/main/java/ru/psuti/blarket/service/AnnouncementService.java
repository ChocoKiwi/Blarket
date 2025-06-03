package ru.psuti.blarket.service;

import ru.psuti.blarket.dto.AnnouncementDTO;
import ru.psuti.blarket.dto.CreateAnnouncementDTO;
import ru.psuti.blarket.dto.UpdateAnnouncementDTO;
import ru.psuti.blarket.model.Announcement;
import ru.psuti.blarket.model.Category;
import ru.psuti.blarket.model.User;

import java.util.List;
import java.util.Set;

public interface AnnouncementService {
    Announcement createAnnouncement(CreateAnnouncementDTO dto, User user, boolean isDraft);
    Announcement updateAnnouncement(Long id, UpdateAnnouncementDTO dto, User user, boolean isDraft);
    void deleteAnnouncement(Long id, User user);
    void archiveAnnouncement(Long id, User user);
    Announcement publishAnnouncement(Long id, User user);
    Announcement restoreAnnouncement(Long id, User user);
    List<AnnouncementDTO> getAnnouncementsByUserAndStatus(User user, Announcement.Status status);
    Announcement getAnnouncementById(Long id, User user);
    Announcement getPublicAnnouncementById(Long id);
    List<AnnouncementDTO> getAnnouncementsByCategory(Long categoryId);
    List<AnnouncementDTO> getAnnouncementsByUserAndStatusIn(User user, List<Announcement.Status> statuses);
    // Новый метод с параметром сортировки
    List<AnnouncementDTO> getAnnouncementsByUserAndStatusInSorted(User user, List<Announcement.Status> statuses, String sort);
    List<AnnouncementDTO> getAllAnnouncementsSorted(String sort);
    List<AnnouncementDTO> searchAnnouncementsGlobally(String query, String sort);
    Set<String> getWordCompletions(String prefix);
    List<Category> getCategoriesByAnnouncements(String query);

    List<Category> getCategoriesByProduct(String query);

    Set<String> getDynamicCompletions(String query);
}