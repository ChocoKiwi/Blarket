package ru.psuti.blarket.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ru.psuti.blarket.dto.RatingDTO;
import ru.psuti.blarket.model.announcement.Announcement;
import ru.psuti.blarket.model.Rating;
import ru.psuti.blarket.model.user.User;
import ru.psuti.blarket.repository.announcement.AnnouncementRepository;
import ru.psuti.blarket.repository.RatingRepository;
import ru.psuti.blarket.service.RatingService;
import ru.psuti.blarket.util.ImageUrlUtil;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RatingServiceImpl implements RatingService {

    private final RatingRepository ratingRepository;
    private final AnnouncementRepository announcementRepository;

    @Override
    public RatingDTO createRating(RatingDTO ratingDTO, User user) {
        Announcement announcement = announcementRepository.findById(ratingDTO.getAnnouncementId())
                .orElseThrow(() -> new IllegalArgumentException("Announcement not found"));

        // Проверка на существующий отзыв
        boolean hasExistingRating = ratingRepository.findByAnnouncementAndUser(announcement, user).isPresent();
        if (hasExistingRating) {
            throw new IllegalStateException("Вы уже оставили отзыв на это объявление");
        }

        Rating rating = Rating.builder()
                .title(ratingDTO.getTitle())
                .description(ratingDTO.getDescription())
                .stars(ratingDTO.getStars())
                .imageUrls(ImageUrlUtil.serializeImageUrls(ratingDTO.getImageUrls()))
                .user(user)
                .announcement(announcement)
                .build();

        rating = ratingRepository.save(rating);
        return RatingDTO.fromRating(rating);
    }

    @Override
    public List<RatingDTO> getRatingsByAnnouncement(Long announcementId) {
        Announcement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new IllegalArgumentException("Announcement not found"));
        return ratingRepository.findByAnnouncement(announcement)
                .stream()
                .map(RatingDTO::fromRating)
                .collect(Collectors.toList());
    }
}