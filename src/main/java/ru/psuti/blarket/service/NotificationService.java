package ru.psuti.blarket.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import ru.psuti.blarket.dto.notification.NotificationDTO;
import ru.psuti.blarket.model.announcement.Announcement;
import ru.psuti.blarket.model.notification.Notification;
import ru.psuti.blarket.model.user.User;
import ru.psuti.blarket.repository.NotificationRepository;
import ru.psuti.blarket.repository.UserRepository;
import ru.psuti.blarket.repository.announcement.AnnouncementRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private AnnouncementRepository announcementRepository;

    @Autowired
    private UserRepository userRepository;

    public NotificationDTO createNotification(NotificationDTO notificationDTO, User buyer) {
        Notification notification = Notification.builder()
                .seller(userRepository.findById(notificationDTO.getSellerId()).orElseThrow())
                .buyer(buyer)
                .announcementIds(notificationDTO.getAnnouncementIds())
                .quantity(notificationDTO.getQuantity())
                .totalPrice(notificationDTO.getTotalPrice())
                .deliveryAddress(notificationDTO.getDeliveryAddress())
                .postalCode(notificationDTO.getPostalCode())
                .createdAt(LocalDateTime.now())
                .build();

        Notification savedNotification = notificationRepository.save(notification);

        List<String> announcementTitles = announcementRepository.findAllById(notificationDTO.getAnnouncementIds())
                .stream()
                .map(Announcement::getTitle)
                .collect(Collectors.toList());

        return NotificationDTO.fromNotification(savedNotification, announcementTitles);
    }

    public List<NotificationDTO> getNotificationsForSeller(Long sellerId) {
        List<Notification> notifications = notificationRepository.findBySellerId(sellerId);
        return notifications.stream()
                .map(notification -> {
                    List<String> announcementTitles = announcementRepository.findAllById(notification.getAnnouncementIds())
                            .stream()
                            .map(Announcement::getTitle)
                            .collect(Collectors.toList());
                    return NotificationDTO.fromNotification(notification, announcementTitles);
                })
                .collect(Collectors.toList());
    }
}