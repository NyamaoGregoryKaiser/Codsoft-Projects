package com.cms.system.service;

import com.cms.system.dto.category.CategoryDto;
import com.cms.system.dto.category.CategoryRequest;
import com.cms.system.exception.ApiException;
import com.cms.system.exception.ResourceNotFoundException;
import com.cms.system.model.Category;
import com.cms.system.repository.CategoryRepository;
import com.cms.system.util.MapperUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional
    @CacheEvict(value = "categories", allEntries = true) // Evict all categories cache on creation
    public CategoryDto createCategory(CategoryRequest categoryRequest) {
        if (categoryRepository.existsByName(categoryRequest.getName())) {
            throw new ApiException("Category with name '" + categoryRequest.getName() + "' already exists.");
        }
        Category category = new Category();
        category.setName(categoryRequest.getName());
        category.setDescription(categoryRequest.getDescription());
        Category savedCategory = categoryRepository.save(category);
        log.info("Category created: {}", savedCategory.getName());
        return MapperUtil.toCategoryDto(savedCategory);
    }

    @Cacheable(value = "categories", key = "#id")
    public CategoryDto getCategoryById(Long id) {
        log.debug("Fetching category with ID: {} from DB", id);
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id " + id));
        return MapperUtil.toCategoryDto(category);
    }

    public Page<CategoryDto> getAllCategories(Pageable pageable) {
        log.debug("Fetching all categories, page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        return categoryRepository.findAll(pageable).map(MapperUtil::toCategoryDto);
    }

    @Transactional
    @CachePut(value = "categories", key = "#id")
    @CacheEvict(value = {"contents", "contentPages"}, allEntries = true) // Clear content cache as well if category changes might affect content listing
    public CategoryDto updateCategory(Long id, CategoryRequest categoryRequest) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id " + id));

        if (categoryRequest.getName() != null && !categoryRequest.getName().equals(category.getName())) {
            if (categoryRepository.existsByName(categoryRequest.getName())) {
                throw new ApiException("Category with name '" + categoryRequest.getName() + "' already exists.");
            }
            category.setName(categoryRequest.getName());
        }
        if (categoryRequest.getDescription() != null) {
            category.setDescription(categoryRequest.getDescription());
        }

        Category updatedCategory = categoryRepository.save(category);
        log.info("Category updated: {}", updatedCategory.getName());
        return MapperUtil.toCategoryDto(updatedCategory);
    }

    @Transactional
    @CacheEvict(value = {"categories", "contents", "contentPages"}, allEntries = true) // Evict all content related caches
    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Category not found with id " + id);
        }
        // Handle associated content: either set category to null or delete content (depending on business rule)
        // For simplicity, let's assume content will be orphaned or deleted by DB cascade if configured.
        // A more robust solution would iterate and set category to null or delete content manually.
        categoryRepository.deleteById(id);
        log.info("Category with ID {} deleted", id);
    }
}