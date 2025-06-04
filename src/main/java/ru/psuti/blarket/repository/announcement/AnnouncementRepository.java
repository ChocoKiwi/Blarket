// AnnouncementRepository.java
package ru.psuti.blarket.repository.announcement;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import ru.psuti.blarket.model.announcement.Announcement;
import ru.psuti.blarket.model.user.User;

import java.util.List;

/**
 * Репозиторий для работы с сущностью {@link Announcement}.
 */
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    /**
     * Находит все объявления, связанные с указанным пользователем.
     *
     * @param user пользователь
     * @return список объявлений
     */
    List<Announcement> findByUser(User user);

    /**
     * Находит все объявления по категории или её подкатегориям.
     *
     * @param categoryId ID категории
     * @return список объявлений
     */
    @Query(value = "WITH RECURSIVE category_tree AS (" +
            "SELECT id FROM categories WHERE id = :categoryId " +
            "UNION ALL " +
            "SELECT c.id FROM categories c " +
            "INNER JOIN category_tree ct ON c.parent_id = ct.id) " +
            "SELECT a.* FROM announcements a WHERE a.category_id IN (SELECT id FROM category_tree)", nativeQuery = true)
    List<Announcement> findByCategoryIdOrSubCategories(Long categoryId);

    /**
     * Находит все объявления по пользователю и статусу.
     *
     * @param user пользователь
     * @return список объявлений
     */
    List<Announcement> findByUserAndStatusIn(User user, List<Announcement.Status> statuses);
    List<Announcement> findByUserAndStatus(User user, Announcement.Status status);
}