```java
package com.tasks.taskmanagement.controller;

import com.tasks.taskmanagement.dto.TagDTO;
import com.tasks.taskmanagement.service.TagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
@Slf4j
public class TagController {

    private final TagService tagService;

    // Create a new tag (Admin only)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TagDTO> createTag(@Valid @RequestBody TagDTO tagDTO) {
        log.info("Received request to create tag: {}", tagDTO.getName());
        TagDTO createdTag = tagService.createTag(tagDTO);
        return new ResponseEntity<>(createdTag, HttpStatus.CREATED);
    }

    // Get tag by ID
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TagDTO> getTagById(@PathVariable UUID id) {
        log.info("Fetching tag with ID: {}", id);
        TagDTO tag = tagService.getTagById(id);
        return ResponseEntity.ok(tag);
    }

    // Get all tags
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<TagDTO>> getAllTags() {
        log.info("Fetching all tags.");
        List<TagDTO> tags = tagService.getAllTags();
        return ResponseEntity.ok(tags);
    }

    // Update tag (Admin only)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TagDTO> updateTag(@PathVariable UUID id, @Valid @RequestBody TagDTO tagDTO) {
        log.info("Updating tag with ID: {}", id);
        TagDTO updatedTag = tagService.updateTag(id, tagDTO);
        return ResponseEntity.ok(updatedTag);
    }

    // Delete tag (Admin only)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTag(@PathVariable UUID id) {
        log.info("Deleting tag with ID: {}", id);
        tagService.deleteTag(id);
        return ResponseEntity.noContent().build();
    }
}
```