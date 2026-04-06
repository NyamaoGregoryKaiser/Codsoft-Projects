package com.cms.system.controller;

import com.cms.system.dto.category.CategoryDto;
import com.cms.system.dto.category.CategoryRequest;
import com.cms.system.service.CategoryService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/categories")
@PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')") // Editors and Admins can manage categories
@Slf4j
public class CategoryApiController {

    private final CategoryService categoryService;

    public CategoryApiController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @PostMapping
    public ResponseEntity<CategoryDto> createCategory(@Valid @RequestBody CategoryRequest categoryRequest) {
        log.info("Creating new category: {}", categoryRequest.getName());
        CategoryDto newCategory = categoryService.createCategory(categoryRequest);
        return new ResponseEntity<>(newCategory, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'USER')") // Even users can view categories
    public ResponseEntity<CategoryDto> getCategoryById(@PathVariable Long id) {
        log.debug("Fetching category with ID: {}", id);
        CategoryDto category = categoryService.getCategoryById(id);
        return ResponseEntity.ok(category);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'USER')") // Even users can view categories
    public ResponseEntity<Page<CategoryDto>> getAllCategories(Pageable pageable) {
        log.debug("Fetching all categories with pagination: {}", pageable);
        Page<CategoryDto> categories = categoryService.getAllCategories(pageable);
        return ResponseEntity.ok(categories);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryDto> updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryRequest categoryRequest) {
        log.info("Updating category with ID: {}", id);
        CategoryDto updatedCategory = categoryService.updateCategory(id, categoryRequest);
        return ResponseEntity.ok(updatedCategory);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCategory(@PathVariable Long id) {
        log.info("Deleting category with ID: {}", id);
        categoryService.deleteCategory(id);
    }
}