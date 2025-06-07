package ru.psuti.blarket.repository.announcement;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.psuti.blarket.model.announcement.Category;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    Optional<Category> findBySlug(String slug);

    List<Category> findByParentIsNull(); // Получение главных категорий

    List<Category> findByParentId(Long parentId); // Получение подкатегорий
}