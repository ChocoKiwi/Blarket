package ru.psuti.blarket.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import ru.psuti.blarket.dto.notification.NotificationDTO;
import ru.psuti.blarket.model.notification.Notification;
import ru.psuti.blarket.model.user.User;
import ru.psuti.blarket.service.NotificationService;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @PostMapping
    public ResponseEntity<NotificationDTO> createNotification(
            @RequestBody NotificationDTO notificationDTO,
            @AuthenticationPrincipal User user) {
        NotificationDTO createdNotification = notificationService.createNotification(notificationDTO, user);
        return ResponseEntity.ok(createdNotification);
    }

    @GetMapping("/seller")
    public ResponseEntity<List<NotificationDTO>> getSellerNotifications(
            @AuthenticationPrincipal User user) {
        List<NotificationDTO> notifications = notificationService.getNotificationsForSeller(user.getId());
        return ResponseEntity.ok(notifications);
    }
}