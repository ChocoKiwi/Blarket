package ru.psuti.blarket.dto.cart;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import ru.psuti.blarket.util.ImageUrlUtil;

@Data
@NoArgsConstructor
public class CartItemDTO {
    private static final Logger LOGGER = LoggerFactory.getLogger(CartItemDTO.class);
    private Long id;

    @NotNull(message = "ID объявления не может быть пустым")
    private Long announcementId;

    private String announcementTitle;
    private String imageUrl;

    @NotNull(message = "Цена не может быть пустой")
    private Double price;

    @NotNull(message = "Количество не может быть пустым")
    @Positive(message = "Количество должно быть больше 0")
    private Integer quantity;

    private Integer availableQuantity;
    private boolean deferred;
    private Long userId;

    public CartItemDTO(Long id, Long announcementId, String announcementTitle, Double price,
                       String imageUrls, Integer availableQuantity, Long quantity) {
        this.id = id;
        this.announcementId = announcementId;
        this.announcementTitle = announcementTitle;
        this.price = price;
        this.imageUrl = parseFirstImageUrl(imageUrls);
        this.availableQuantity = availableQuantity;
        this.quantity = quantity.intValue();
        this.deferred = false;
    }

    private String parseFirstImageUrl(String imageUrls) {
        LOGGER.debug("Парсинг imageUrls: {}", imageUrls);
        if (imageUrls == null || imageUrls.isEmpty()) {
            LOGGER.warn("imageUrls пустой или null");
            return null;
        }
        try {
            String[] urls = ImageUrlUtil.parseImageUrls(imageUrls);
            String result = urls.length > 0 ? urls[0] : null;
            LOGGER.debug("Извлечен первый URL: {}", result);
            return result;
        } catch (Exception e) {
            LOGGER.error("Ошибка парсинга imageUrls: {}", imageUrls, e);
            return null;
        }
    }
}