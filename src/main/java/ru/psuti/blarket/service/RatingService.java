package ru.psuti.blarket.service;

import ru.psuti.blarket.dto.RatingDTO;
import ru.psuti.blarket.model.user.User;

import java.util.List;

public interface RatingService {
    RatingDTO createRating(RatingDTO ratingDTO, User user);
    List<RatingDTO> getRatingsByAnnouncement(Long announcementId);
}