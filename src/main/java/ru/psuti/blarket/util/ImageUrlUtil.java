package ru.psuti.blarket.util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public final class ImageUrlUtil {
    private static final Logger LOGGER = LoggerFactory.getLogger(ImageUrlUtil.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private ImageUrlUtil() {}

    public static String[] parseImageUrls(String imageUrls) {
        LOGGER.debug("Парсинг imageUrls: {}", imageUrls);
        if (imageUrls == null || imageUrls.isEmpty()) {
            LOGGER.warn("imageUrls пустой или null");
            return new String[0];
        }
        try {
            String[] urls = objectMapper.readValue(imageUrls, new TypeReference<String[]>() {});
            LOGGER.debug("Успешно распарсено: {}", Arrays.toString(urls));
            return urls;
        } catch (Exception e) {
            LOGGER.error("Ошибка парсинга JSON: {}", imageUrls, e);
            return Arrays.stream(imageUrls.split(","))
                    .filter(url -> url != null && url.startsWith("data:image/") && url.contains(";base64,"))
                    .toArray(String[]::new);
        }
    }

    public static String serializeImageUrls(List<String> imageUrls) {
        if (imageUrls == null || imageUrls.isEmpty()) {
            return "[]";
        }
        try {
            return objectMapper.writeValueAsString(imageUrls);
        } catch (Exception e) {
            throw new IllegalArgumentException("Ошибка при сериализации изображений", e);
        }
    }

    public static List<String> parseImageUrlsToList(String imageUrls) {
        return Arrays.stream(parseImageUrls(imageUrls))
                .collect(Collectors.toList());
    }
}