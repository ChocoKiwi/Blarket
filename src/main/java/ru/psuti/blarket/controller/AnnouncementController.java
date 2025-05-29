package ru.psuti.blarket.controller;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import ru.psuti.blarket.dto.CreateAnnouncementDTO;
import ru.psuti.blarket.dto.UpdateAnnouncementDTO;
import ru.psuti.blarket.model.Announcement;
import ru.psuti.blarket.model.User;
import ru.psuti.blarket.service.AnnouncementService;

import java.util.Map;

/**
 * Контроллер для управления объявлениями (создание, обновление, удаление, получение).
 */
@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private static final Logger LOGGER = LoggerFactory.getLogger(AnnouncementController.class);
    private static final String ERROR_UNAUTHORIZED = "Неавторизован";

    private final AnnouncementService announcementService;

    /**
     * Создает новое объявление.
     */
    @PostMapping
    public ResponseEntity<?> createAnnouncement(@RequestBody CreateAnnouncementDTO dto, @AuthenticationPrincipal User user) {
        if (user == null) {
            LOGGER.warn("Неавторизованный доступ к созданию объявления");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        try {
            Announcement announcement = announcementService.createAnnouncement(dto, user);
            return ResponseEntity.status(HttpStatus.CREATED).body(announcement);
        } catch (Exception e) {
            LOGGER.error("Ошибка при создании объявления: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Обновляет существующее объявление.
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateAnnouncement(@PathVariable Long id, @RequestBody UpdateAnnouncementDTO dto, @AuthenticationPrincipal User user) {
        if (user == null) {
            LOGGER.warn("Неавторизованный доступ к обновлению объявления");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        try {
            Announcement announcement = announcementService.updateAnnouncement(id, dto, user);
            return ResponseEntity.ok(announcement);
        } catch (Exception e) {
            LOGGER.error("Ошибка при обновлении объявления с ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Удаляет объявление.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAnnouncement(@PathVariable Long id, @AuthenticationPrincipal User user) {
        if (user == null) {
            LOGGER.warn("Неавторизованный доступ к удалению объявления");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        try {
            announcementService.deleteAnnouncement(id, user);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            LOGGER.error("Ошибка при удалении объявления с ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Получает список объявлений текущего пользователя.
     */
    @GetMapping
    public ResponseEntity<?> getAnnouncements(@AuthenticationPrincipal User user) {
        if (user == null) {
            LOGGER.warn("Неавторизованный доступ к получению объявлений");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        try {
            return ResponseEntity.ok(announcementService.getAnnouncementsByUser(user));
        } catch (Exception e) {
            LOGGER.error("Ошибка при получении объявлений: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Ошибка сервера"));
        }
    }

    /**
     * Получает объявление по ID для редактирования.
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getAnnouncementById(@PathVariable Long id, @AuthenticationPrincipal User user) {
        if (user == null) {
            LOGGER.warn("Неавторизованный доступ к получению объявления с ID {}", id);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        try {
            Announcement announcement = announcementService.getAnnouncementById(id, user);
            return ResponseEntity.ok(UpdateAnnouncementDTO.fromAnnouncement(announcement));
        } catch (Exception e) {
            LOGGER.error("Ошибка при получении объявления с ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Объявление не найдено"));
        }
    }

    /**
     * Получает объявления по категории (включая подкатегории).
     */
    @GetMapping("/categories/{categoryId}")
    public ResponseEntity<?> getAnnouncementsByCategory(@PathVariable Long categoryId) {
        try {
            return ResponseEntity.ok(announcementService.getAnnouncementsByCategory(categoryId));
        } catch (Exception e) {
            LOGGER.error("Ошибка при получении объявлений для категории с ID {}: {}", categoryId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }
}