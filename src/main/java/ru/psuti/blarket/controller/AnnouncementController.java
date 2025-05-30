package ru.psuti.blarket.controller;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import ru.psuti.blarket.dto.AnnouncementDTO;
import ru.psuti.blarket.dto.CreateAnnouncementDTO;
import ru.psuti.blarket.dto.UpdateAnnouncementDTO;
import ru.psuti.blarket.model.Announcement;
import ru.psuti.blarket.model.User;
import ru.psuti.blarket.service.AnnouncementService;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private static final Logger LOGGER = LoggerFactory.getLogger(AnnouncementController.class);
    private static final String ERROR_UNAUTHORIZED = "Неавторизован";

    private final AnnouncementService announcementService;

    @PostMapping
    public ResponseEntity<?> createAnnouncement(@RequestBody CreateAnnouncementDTO dto, @AuthenticationPrincipal User user) {
        if (user == null) {
            LOGGER.warn("Неавторизованный доступ к созданию объявления");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        try {
            Announcement announcement = announcementService.createAnnouncement(dto, user, false);
            return ResponseEntity.status(HttpStatus.CREATED).body(announcement);
        } catch (Exception e) {
            LOGGER.error("Ошибка при создании объявления: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/draft")
    public ResponseEntity<?> createDraft(@RequestBody CreateAnnouncementDTO dto, @AuthenticationPrincipal User user) {
        if (user == null) {
            LOGGER.warn("Неавторизованный доступ к созданию черновика");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        try {
            Announcement announcement = announcementService.createAnnouncement(dto, user, true);
            return ResponseEntity.status(HttpStatus.CREATED).body(announcement);
        } catch (Exception e) {
            LOGGER.error("Ошибка при создании черновика: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAnnouncement(@PathVariable Long id, @RequestBody UpdateAnnouncementDTO dto, @AuthenticationPrincipal User user) {
        if (user == null) {
            LOGGER.warn("Неавторизованный доступ к обновлению объявления");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        try {
            Announcement announcement = announcementService.updateAnnouncement(id, dto, user, false);
            return ResponseEntity.ok(announcement);
        } catch (Exception e) {
            LOGGER.error("Ошибка при обновлении объявления с ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/draft")
    public ResponseEntity<?> updateDraft(@PathVariable Long id, @RequestBody UpdateAnnouncementDTO dto, @AuthenticationPrincipal User user) {
        if (user == null) {
            LOGGER.warn("Неавторизованный доступ к обновлению черновика");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        try {
            Announcement announcement = announcementService.updateAnnouncement(id, dto, user, true);
            return ResponseEntity.ok(announcement);
        } catch (Exception e) {
            LOGGER.error("Ошибка при обновлении черновика с ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

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

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> request, @AuthenticationPrincipal User user) {
        if (user == null) {
            LOGGER.warn("Неавторизованный доступ к изменению статуса объявления");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        try {
            String status = request.get("status");
            Announcement announcement;
            switch (status.toUpperCase()) {
                case "ARCHIVED":
                    announcementService.archiveAnnouncement(id, user);
                    return ResponseEntity.noContent().build();
                case "ACTIVE":
                    announcement = announcementService.publishAnnouncement(id, user);
                    return ResponseEntity.ok(announcement);
                case "RESTORED":
                    announcement = announcementService.restoreAnnouncement(id, user);
                    return ResponseEntity.ok(announcement);
                default:
                    return ResponseEntity.badRequest().body(Map.of("message", "Недопустимый статус"));
            }
        } catch (Exception e) {
            LOGGER.error("Ошибка при изменении статуса объявления с ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAnnouncements(@AuthenticationPrincipal User user, @RequestParam(required = false) String status) {
        if (user == null) {
            LOGGER.warn("Неавторизованный доступ к получению объявлений");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ERROR_UNAUTHORIZED));
        }
        try {
            List<AnnouncementDTO> announcements;
            if (status != null && !status.isEmpty()) {
                if (status.contains(",")) {
                    List<Announcement.Status> statuses = Arrays.stream(status.split(","))
                            .map(String::trim)
                            .map(String::toUpperCase)
                            .map(Announcement.Status::valueOf)
                            .collect(Collectors.toList());
                    announcements = announcementService.getAnnouncementsByUserAndStatus(user, null);
                } else {
                    Announcement.Status announcementStatus = Announcement.Status.valueOf(status.toUpperCase());
                    announcements = announcementService.getAnnouncementsByUserAndStatus(user, announcementStatus);
                }
            } else {
                announcements = announcementService.getAnnouncementsByUserAndStatus(user, null);
            }
            return ResponseEntity.ok(announcements);
        } catch (IllegalArgumentException e) {
            LOGGER.error("Недопустимый статус: {}", status, e);
            return ResponseEntity.badRequest().body(Map.of("message", "Недопустимый статус"));
        } catch (Exception e) {
            LOGGER.error("Ошибка при получении объявлений: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Ошибка сервера"));
        }
    }

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