package ru.psuti.blarket.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import ru.psuti.blarket.dto.RatingDTO;
import ru.psuti.blarket.model.user.User;
import ru.psuti.blarket.service.RatingService;

import java.util.List;

@RestController
@RequestMapping("/api/ratings")
@RequiredArgsConstructor
public class RatingController {

    private final RatingService ratingService;

    @PostMapping
    public ResponseEntity<?> createRating(
            @RequestBody RatingDTO ratingDTO,
            @AuthenticationPrincipal User user) {
        try {
            RatingDTO createdRating = ratingService.createRating(ratingDTO, user);
            return ResponseEntity.ok(createdRating);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/announcement/{announcementId}")
    public ResponseEntity<List<RatingDTO>> getRatingsByAnnouncement(@PathVariable Long announcementId) {
        List<RatingDTO> ratings = ratingService.getRatingsByAnnouncement(announcementId);
        return ResponseEntity.ok(ratings);
    }
}