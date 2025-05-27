package ru.psuti.blarket.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import ru.psuti.blarket.dto.CreateAnnouncementDTO;
import ru.psuti.blarket.dto.UpdateAnnouncementDTO;
import ru.psuti.blarket.model.Announcement;
import ru.psuti.blarket.model.User;
import ru.psuti.blarket.service.AnnouncementService;
import ru.psuti.blarket.repository.AnnouncementRepository;

import java.util.List;

@RestController
@RequestMapping("/api/announcements")
public class AnnouncementController {

    @Autowired
    private AnnouncementService announcementService;

    @Autowired
    private AnnouncementRepository announcementRepository;

    @PostMapping
    public ResponseEntity<Announcement> createAnnouncement(@RequestBody CreateAnnouncementDTO dto, @AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(null);
        }
        Announcement announcement = announcementService.createAnnouncement(dto, user.getId());
        return ResponseEntity.ok(announcement);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Announcement> updateAnnouncement(@PathVariable Long id, @RequestBody UpdateAnnouncementDTO dto, @AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(null);
        }
        Announcement announcement = announcementService.updateAnnouncement(id, dto, user.getId());
        return ResponseEntity.ok(announcement);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAnnouncement(@PathVariable Long id, @AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        announcementService.deleteAnnouncement(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<Announcement>> getAnnouncements(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(null);
        }
        List<Announcement> announcements = announcementRepository.findByUserId(user.getId());
        return ResponseEntity.ok(announcements);
    }
}