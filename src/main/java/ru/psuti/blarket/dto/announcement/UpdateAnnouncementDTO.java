// UpdateAnnouncementDTO.java
package ru.psuti.blarket.dto.announcement;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import ru.psuti.blarket.model.announcement.Announcement;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

@Data
public class UpdateAnnouncementDTO {
    private String title;
    private String description;
    private Double price;
    private Long categoryId;
    private List<String> imageUrls;
    private String address;
    private Integer quantity;
    private Announcement.Condition itemCondition;
    private List<String> deliveryOptions;
    private Announcement.Status status; // Новое поле

    private static final ObjectMapper objectMapper = new ObjectMapper();

    public static UpdateAnnouncementDTO fromAnnouncement(Announcement announcement) {
        UpdateAnnouncementDTO dto = new UpdateAnnouncementDTO();
        dto.setTitle(announcement.getTitle());
        dto.setDescription(announcement.getDescription());
        dto.setPrice(announcement.getPrice());
        dto.setCategoryId(announcement.getCategory() != null ? announcement.getCategory().getId() : null);
        try {
            dto.setImageUrls(announcement.getImageUrls() != null
                    ? objectMapper.readValue(announcement.getImageUrls(), new TypeReference<List<String>>() {})
                    : Collections.emptyList());
        } catch (Exception e) {
            dto.setImageUrls(Collections.emptyList());
        }
        dto.setAddress(announcement.getAddress());
        dto.setQuantity(announcement.getQuantity());
        dto.setItemCondition(announcement.getCondition());
        dto.setDeliveryOptions(announcement.getDeliveryOptions() != null
                ? announcement.getDeliveryOptions()
                : Collections.emptyList());
        dto.setStatus(announcement.getStatus());
        return dto;
    }
}