package com.cms.system.controller;

import com.cms.system.dto.content.ContentCreateRequest;
import com.cms.system.dto.content.ContentDto;
import com.cms.system.dto.content.ContentUpdateRequest;
import com.cms.system.model.Content;
import com.cms.system.service.ContentService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/content")
@Slf4j
public class ContentApiController {

    private final ContentService contentService;

    public ContentApiController(ContentService contentService) {
        this.contentService = contentService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')") // Only ADMINs and EDITORs can create content
    public ResponseEntity<ContentDto> createContent(@Valid @RequestBody ContentCreateRequest request) {
        log.info("Creating new content with title: {}", request.getTitle());
        ContentDto newContent = contentService.createContent(request);
        return new ResponseEntity<>(newContent, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContentDto> getContentById(@PathVariable Long id) {
        log.debug("Fetching content with ID: {}", id);
        ContentDto content = contentService.getContentById(id);
        return ResponseEntity.ok(content);
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<ContentDto> getContentBySlug(@PathVariable String slug) {
        log.debug("Fetching content with slug: {}", slug);
        ContentDto content = contentService.getContentBySlug(slug);
        return ResponseEntity.ok(content);
    }

    @GetMapping
    public ResponseEntity<Page<ContentDto>> getAllContent(@RequestParam(required = false) Content.ContentStatus status, Pageable pageable) {
        log.debug("Fetching all content with pagination: {}", pageable);
        Page<ContentDto> contentPage;
        if (status != null) {
            contentPage = contentService.getContentByStatus(status, pageable);
        } else {
            contentPage = contentService.getAllContent(pageable);
        }
        return ResponseEntity.ok(contentPage);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')") // Only ADMINs and EDITORs can update content
    public ResponseEntity<ContentDto> updateContent(@PathVariable Long id, @Valid @RequestBody ContentUpdateRequest request) {
        log.info("Updating content with ID: {}", id);
        ContentDto updatedContent = contentService.updateContent(id, request);
        return ResponseEntity.ok(updatedContent);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')") // Only ADMINs and EDITORs can delete content
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteContent(@PathVariable Long id) {
        log.info("Deleting content with ID: {}", id);
        contentService.deleteContent(id);
    }
}