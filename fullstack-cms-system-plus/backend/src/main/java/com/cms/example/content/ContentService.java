```java
package com.cms.example.content;

import com.cms.example.category.Category;
import com.cms.example.category.CategoryRepository;
import com.cms.example.exception.ResourceNotFoundException;
import com.cms.example.user.User;
import com.cms.example.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ContentService {

    private final ContentRepository contentRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    @Cacheable(value = "content", key = "#id")
    public Optional<ContentDTO> getContentById(Long id) {
        return contentRepository.findById(id).map(ContentDTO::fromEntity);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "content", key = "#slug + '_' + #status")
    public Optional<ContentDTO> getContentBySlugAndStatus(String slug, ContentStatus status) {
        return contentRepository.findBySlugAndStatus(slug, status).map(ContentDTO::fromEntity);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "contentPages", key = "#page + '_' + #size + '_' + #sortBy")
    public Page<ContentDTO> getAllContent(int page, int size, String sortBy) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy));
        return contentRepository.findAll(pageable).map(ContentDTO::fromEntity);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "publishedContentPages", key = "#page + '_' + #size + '_' + #sortBy")
    public Page<ContentDTO> getPublishedContent(int page, int size, String sortBy) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy));
        return contentRepository.findByStatus(ContentStatus.PUBLISHED, pageable).map(ContentDTO::fromEntity);
    }

    @Transactional
    @PreAuthorize("hasAnyAuthority('ADMIN', 'EDITOR')") // Only Admins or Editors can create content
    @CacheEvict(value = {"content", "contentPages", "publishedContentPages"}, allEntries = true)
    public ContentDTO createContent(ContentDTO contentDTO, Long authorId) {
        if (contentRepository.existsByTitle(contentDTO.getTitle())) {
            throw new IllegalArgumentException("Content with title '" + contentDTO.getTitle() + "' already exists.");
        }
        if (contentRepository.existsBySlug(contentDTO.getSlug())) { // Consider generating unique slug
             throw new IllegalArgumentException("Content with slug '" + contentDTO.getSlug() + "' already exists.");
        }

        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new ResourceNotFoundException("Author not found with id: " + authorId));

        Category category = null;
        if (contentDTO.getCategoryId() != null) {
            category = categoryRepository.findById(contentDTO.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + contentDTO.getCategoryId()));
        }

        Content content = Content.builder()
                .title(contentDTO.getTitle())
                .slug(contentDTO.getSlug() != null && !contentDTO.getSlug().isEmpty() ? contentDTO.getSlug() : contentDTO.getTitle().toLowerCase().replace(" ", "-").replaceAll("[^a-z0-9-]", ""))
                .body(contentDTO.getBody())
                .featuredImage(contentDTO.getFeaturedImage())
                .status(contentDTO.getStatus() != null ? contentDTO.getStatus() : ContentStatus.DRAFT)
                .type(contentDTO.getType() != null ? contentDTO.getType() : ContentType.POST)
                .author(author)
                .category(category)
                .build();

        Content savedContent = contentRepository.save(content);
        return ContentDTO.fromEntity(savedContent);
    }

    @Transactional
    @PreAuthorize("hasAnyAuthority('ADMIN', 'EDITOR') or @contentService.isContentAuthor(#id, authentication.principal.id)") // Editor can edit their own or Admin can edit any
    @CacheEvict(value = {"content", "contentPages", "publishedContentPages"}, allEntries = true)
    public ContentDTO updateContent(Long id, ContentDTO contentDTO) {
        Content existingContent = contentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Content not found with id: " + id));

        // Check if title changed and new title already exists (excluding current content)
        if (!existingContent.getTitle().equals(contentDTO.getTitle()) && contentRepository.existsByTitle(contentDTO.getTitle())) {
            throw new IllegalArgumentException("Content with title '" + contentDTO.getTitle() + "' already exists.");
        }
        // Check if slug changed and new slug already exists (excluding current content)
        String newSlug = contentDTO.getSlug() != null && !contentDTO.getSlug().isEmpty() ? contentDTO.getSlug() : contentDTO.getTitle().toLowerCase().replace(" ", "-").replaceAll("[^a-z0-9-]", "");
        if (!existingContent.getSlug().equals(newSlug) && contentRepository.existsBySlug(newSlug)) {
            throw new IllegalArgumentException("Content with slug '" + newSlug + "' already exists.");
        }

        Category category = null;
        if (contentDTO.getCategoryId() != null) {
            category = categoryRepository.findById(contentDTO.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + contentDTO.getCategoryId()));
        }

        existingContent.setTitle(contentDTO.getTitle());
        existingContent.setSlug(newSlug);
        existingContent.setBody(contentDTO.getBody());
        existingContent.setFeaturedImage(contentDTO.getFeaturedImage());
        existingContent.setStatus(contentDTO.getStatus() != null ? contentDTO.getStatus() : existingContent.getStatus());
        existingContent.setType(contentDTO.getType() != null ? contentDTO.getType() : existingContent.getType());
        existingContent.setCategory(category); // Update category
        if (existingContent.getStatus() == ContentStatus.PUBLISHED && existingContent.getPublishedAt() == null) {
            existingContent.setPublishedAt(LocalDateTime.now());
        }

        Content updatedContent = contentRepository.save(existingContent);
        return ContentDTO.fromEntity(updatedContent);
    }

    @Transactional
    @PreAuthorize("hasAnyAuthority('ADMIN', 'EDITOR') or @contentService.isContentAuthor(#id, authentication.principal.id)") // Editor can delete their own or Admin can delete any
    @CacheEvict(value = {"content", "contentPages", "publishedContentPages"}, allEntries = true)
    public void deleteContent(Long id) {
        if (!contentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Content not found with id: " + id);
        }
        contentRepository.deleteById(id);
    }

    /**
     * Helper method for Spring Security @PreAuthorize to check if the current user is the author of the content.
     * Needs to be public for Spring Expression Language (SpEL) access.
     */
    @Transactional(readOnly = true)
    public boolean isContentAuthor(Long contentId, Long userId) {
        return contentRepository.findById(contentId)
                .map(content -> content.getAuthor().getId().equals(userId))
                .orElse(false);
    }
}
```