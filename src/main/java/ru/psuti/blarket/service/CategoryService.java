// CategoryService.java
package ru.psuti.blarket.service;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.hibernate.Hibernate;
import org.springframework.stereotype.Service;
import ru.psuti.blarket.model.Category;
import ru.psuti.blarket.repository.CategoryRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public List<Category> getTopLevelCategories() {
        return categoryRepository.findByParentIsNull();
    }

    public List<Category> getSubCategories(Long parentId) {
        return categoryRepository.findByParentId(parentId);
    }

    public Optional<Category> getCategoryBySlug(String slug) {
        return categoryRepository.findBySlug(slug);
    }

    public Category createCategory(Category category) {
        category.setCreatedAt(LocalDateTime.now());
        category.setUpdatedAt(LocalDateTime.now());
        return categoryRepository.save(category);
    }

    public Optional<Category> updateCategory(Long id, Category updatedCategory) {
        return categoryRepository.findById(id).map(existingCategory -> {
            existingCategory.setName(updatedCategory.getName());
            existingCategory.setSlug(updatedCategory.getSlug());
            existingCategory.setParent(updatedCategory.getParent());
            existingCategory.setUpdatedAt(LocalDateTime.now());
            return categoryRepository.save(existingCategory);
        });
    }

    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }

    public Category getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Категория не найдена"));
        Hibernate.initialize(category.getParent());
        return category;
    }

    public CategoryWithParent getCategoryWithParent(Long id) {
        Category child = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Категория не найдена"));
        Hibernate.initialize(child.getParent());
        Category parent = child.getParent();
        return new CategoryWithParent(parent, child);
    }

    @Data
    @AllArgsConstructor
    public static class CategoryWithParent {
        private Category parent;
        private Category child;
    }
}