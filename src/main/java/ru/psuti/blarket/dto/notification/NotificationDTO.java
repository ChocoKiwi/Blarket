package ru.psuti.blarket.dto.notification;

import lombok.Data;
import ru.psuti.blarket.model.notification.Notification;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class NotificationDTO {
    private Long id;
    private Long sellerId;
    private Long buyerId;
    private String buyerName;
    private List<Long> announcementIds;
    private List<String> announcementTitles;
    private Integer quantity;
    private Double totalPrice;
    private String deliveryAddress;
    private String postalCode;
    private LocalDateTime createdAt;

    public static NotificationDTO fromNotification(Notification notification, List<String> announcementTitles) {
        NotificationDTO dto = new NotificationDTO();
        dto.setId(notification.getId());
        dto.setSellerId(notification.getSeller().getId());
        dto.setBuyerId(notification.getBuyer().getId());
        dto.setBuyerName(notification.getBuyer().getName());
        dto.setAnnouncementIds(notification.getAnnouncementIds());
        dto.setAnnouncementTitles(announcementTitles);
        dto.setQuantity(notification.getQuantity());
        dto.setTotalPrice(notification.getTotalPrice());
        dto.setDeliveryAddress(notification.getDeliveryAddress());
        dto.setPostalCode(notification.getPostalCode());
        dto.setCreatedAt(notification.getCreatedAt());
        return dto;
    }
}