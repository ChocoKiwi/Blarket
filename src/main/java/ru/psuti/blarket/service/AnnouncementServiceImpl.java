package ru.psuti.blarket.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import ru.psuti.blarket.model.Announcement;
import ru.psuti.blarket.dto.CreateAnnouncementDTO;
import ru.psuti.blarket.dto.UpdateAnnouncementDTO;
import ru.psuti.blarket.repository.AnnouncementRepository;

@Service
public class AnnouncementServiceImpl implements AnnouncementService {

    @Autowired
    private AnnouncementRepository announcementRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public Announcement createAnnouncement(CreateAnnouncementDTO dto, Long userId) {
        Announcement announcement = new Announcement();
        announcement.setTitle(dto.getTitle());
        announcement.setDescription(dto.getDescription());
        announcement.setPrice(dto.getPrice());
        announcement.setQuantity(dto.getQuantity());
        announcement.setUserId(userId);
        announcement.setAddress(dto.getAddress());
        announcement.setCondition(dto.getItemCondition());
        announcement.setCreatedAt(LocalDateTime.now());

        if (dto.getImageUrls() != null) {
            try {
                announcement.setImageUrls(objectMapper.writeValueAsString(dto.getImageUrls()));
            } catch (Exception e) {
                throw new RuntimeException("Ошибка преобразования imageUrls");
            }
        }

        return announcementRepository.save(announcement);
    }

    @Override
    public Announcement updateAnnouncement(Long id, UpdateAnnouncementDTO dto, Long userId) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Объявление не найдено"));
        if (!announcement.getUserId().equals(userId)) {
            throw new RuntimeException("Нет прав для изменения этого объявления");
        }

        if (dto.getTitle() != null) announcement.setTitle(dto.getTitle());
        if (dto.getDescription() != null) announcement.setDescription(dto.getDescription());
        if (dto.getPrice() != null) announcement.setPrice(dto.getPrice());
        if (dto.getQuantity() != null) announcement.setQuantity(dto.getQuantity());
        if (dto.getItemCondition() != null) announcement.setCondition(dto.getItemCondition());

        if (dto.getImageUrls() != null) {
            try {
                announcement.setImageUrls(objectMapper.writeValueAsString(dto.getImageUrls()));
            } catch (Exception e) {
                throw new RuntimeException("Ошибка преобразования imageUrls");
            }
        }

        announcement.setUpdatedAt(LocalDateTime.now());
        return announcementRepository.save(announcement);
    }

    @Override
    public void deleteAnnouncement(Long id, Long userId) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Объявление не найдено"));
        if (!announcement.getUserId().equals(userId)) {
            throw new RuntimeException("Нет прав для удаления этого объявления");
        }
        announcementRepository.delete(announcement);
    }
}