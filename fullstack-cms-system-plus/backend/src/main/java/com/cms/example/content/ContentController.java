```java
package com.cms.example.content;

import com.cms.example.exception.ResourceNotFoundException;
import com.cms.example.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/content")
@RequiredArgsConstructor
public class ContentController {

    private final ContentService contentService;

    // Public endpoint for published content
    @GetMapping("/public")
    public ResponseEntity<Page<ContentDTO>> getPublishedContent(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "publishedAt") String sortBy) {
        return ResponseEntity.ok(contentService.getPublishedContent(page, size, sortBy));
    }

    // Public endpoint for published content by slug
    @GetMapping("/public/{slug}")
    public ResponseEntity<ContentDTO> getPublishedContentBySlug(@PathVariable String slug) {
        return contentService.getContentBySlugAndStatus(slug, ContentStatus.PUBLISHED)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("Published content not found with slug: " + slug));
    }

    // Protected endpoint for all content (drafts, published, archived) - requires authentication
    @GetMapping
    public ResponseEntity<Page<ContentDTO>> getAllContent(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy) {
        return ResponseEntity.ok(contentService.getAllContent(page, size, sortBy));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContentDTO> getContentById(@PathVariable Long id) {
        return contentService.getContentById(id)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("Content not found with id: " + id));
    }

    @PostMapping
    public ResponseEntity<ContentDTO> createContent(
            @Valid @RequestBody ContentDTO contentDTO,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        ContentDTO createdContent = contentService.createContent(contentDTO, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdContent);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ContentDTO> updateContent(
            @PathVariable Long id,
            @Valid @RequestBody ContentDTO contentDTO,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        ContentDTO updatedContent = contentService.updateContent(id, contentDTO);
        return ResponseEntity.ok(updatedContent);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteContent(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        contentService.deleteContent(id);
        return ResponseEntity.noContent().build();
    }
}
```