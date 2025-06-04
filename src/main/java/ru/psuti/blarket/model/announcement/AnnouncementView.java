// AnnouncementView.java
package ru.psuti.blarket.model.announcement;

import jakarta.persistence.*;
import lombok.*;
import ru.psuti.blarket.model.user.User;

import java.time.LocalDateTime;

@Entity
@Table(name = "announcement_views")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnnouncementView {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "announcement_id", nullable = false)
    private Announcement announcement;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user; // Связь с таблицей users, может быть null

    @Column(nullable = false)
    private LocalDateTime visitTime;

    @Column(nullable = false)
    private String visitorAddress;
}