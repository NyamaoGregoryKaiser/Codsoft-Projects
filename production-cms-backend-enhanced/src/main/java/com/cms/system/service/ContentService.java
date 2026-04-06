package com.cms.system.service;

import com.cms.system.dto.content.ContentCreateRequest;
import com.cms.system.dto.content.ContentDto;
import com.cms.system.dto.content.ContentUpdateRequest;
import com.cms.system.exception.ResourceNotFoundException;
import com.cms.system.model.Category;
import com.cms.system.model.Content;
import com.cms.system.model.User;
import com.cms.system.repository.CategoryRepository;
import com.cms.system.repository.ContentRepository;
import com.cms.system.repository.UserRepository;
import com.cms.system.util.MapperUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
public class ContentService {

    private final ContentRepository contentRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public ContentService(ContentRepository contentRepository, CategoryRepository categoryRepository, UserRepository userRepository) {
        this.contentRepository = contentRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    @CacheEvict(value = "contentPages", allEntries = true) // Evict all content pages cache on creation
    public ContentDto createContent(ContentCreateRequest request) {
        Content content = new Content();
        content.setTitle(request.getTitle());
        content.setBody(request.getBody());
        content.setSlug(request.getSlug());
        content.setStatus(request.getStatus());

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id " + request.getCategoryId()));
        content.setCategory(category);

        // Get authenticated user as author
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User author = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Author not found: " + username));
        content.setAuthor(author);

        Content savedContent = contentRepository.save(content);
        log.info("Content created: {} by {}", savedContent.getTitle(), savedContent.getAuthor().getUsername());
        return MapperUtil.toContentDto(savedContent);
    }

    @Cacheable(value = "contents", key = "#id")
    public ContentDto getContentById(Long id) {
        log.debug("Fetching content with ID: {} from DB", id);
        Content content = contentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Content not found with id " + id));
        return MapperUtil.toContentDto(content);
    }

    @Cacheable(value = "contents", key = "#slug")
    public ContentDto getContentBySlug(String slug) {
        log.debug("Fetching content with slug: {} from DB", slug);
        Content content = contentRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Content not found with slug " + slug));
        return MapperUtil.toContentDto(content);
    }

    @Cacheable(value = "contentPages", key = "{#pageable.pageNumber, #pageable.pageSize, #pageable.sort}")
    public Page<ContentDto> getAllContent(Pageable pageable) {
        log.debug("Fetching all content, page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        return contentRepository.findAll(pageable).map(MapperUtil::toContentDto);
    }

    public Page<ContentDto> getContentByStatus(Content.ContentStatus status, Pageable pageable) {
        log.debug("Fetching content by status: {}, page: {}, size: {}", status, pageable.getPageNumber(), pageable.getPageSize());
        return contentRepository.findByStatus(status, pageable).map(MapperUtil::toContentDto);
    }

    @Transactional
    @CachePut(value = "contents", key = "#id")
    @CacheEvict(value = "contentPages", allEntries = true) // Evict all content pages cache on update
    public ContentDto updateContent(Long id, ContentUpdateRequest request) {
        Content content = contentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Content not found with id " + id));

        Optional.ofNullable(request.getTitle()).ifPresent(content::setTitle);
        Optional.ofNullable(request.getBody()).ifPresent(content::setBody);
        Optional.ofNullable(request.getSlug()).ifPresent(content::setSlug);
        Optional.ofNullable(request.getStatus()).ifPresent(content::setStatus);

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with id " + request.getCategoryId()));
            content.setCategory(category);
        }

        Content updatedContent = contentRepository.save(content);
        log.info("Content updated: {} (ID: {})", updatedContent.getTitle(), updatedContent.getId());
        return MapperUtil.toContentDto(updatedContent);
    }

    @Transactional
    @CacheEvict(value = {"contents", "contentPages"}, allEntries = true) // Evict specific content and all pages cache
    public void deleteContent(Long id) {
        if (!contentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Content not found with id " + id);
        }
        contentRepository.deleteById(id);
        log.info("Content with ID {} deleted", id);
    }
}