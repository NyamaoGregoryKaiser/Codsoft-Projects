package com.cms.system.service;

import com.cms.system.dto.content.ContentCreateRequest;
import com.cms.system.dto.content.ContentDto;
import com.cms.system.dto.content.ContentUpdateRequest;
import com.cms.system.exception.ResourceNotFoundException;
import com.cms.system.model.Category;
import com.cms.system.model.Content;
import com.cms.system.model.User;
import com.cms.system.model.Role;
import com.cms.system.repository.CategoryRepository;
import com.cms.system.repository.ContentRepository;
import com.cms.system.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;
import java.util.Set;

import static com.cms.system.model.Role.ERole.ROLE_ADMIN;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ContentService Unit Tests")
class ContentServiceTest {

    @Mock
    private ContentRepository contentRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private SecurityContext securityContext;
    @Mock
    private Authentication authentication;

    @InjectMocks
    private ContentService contentService;

    private User testUser;
    private Category testCategory;

    @BeforeEach
    void setUp() {
        Role adminRole = new Role(1L, ROLE_ADMIN);
        testUser = new User(1L, "testuser", "test@example.com", "password", true, Set.of(adminRole), LocalDateTime.now(), LocalDateTime.now());
        testCategory = new Category(1L, "Test Category", "Description", LocalDateTime.now(), LocalDateTime.now(), Collections.emptySet());

        // Mock SecurityContextHolder for author retrieval
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(authentication.getName()).thenReturn(testUser.getUsername());
        when(userRepository.findByUsername(testUser.getUsername())).thenReturn(Optional.of(testUser));
    }

    @Test
    void createContent_shouldReturnContentDto() {
        // Given
        ContentCreateRequest request = new ContentCreateRequest();
        request.setTitle("New Content");
        request.setBody("Content body here.");
        request.setCategoryId(testCategory.getId());
        request.setStatus(Content.ContentStatus.DRAFT);

        Content content = new Content();
        content.setId(1L);
        content.setTitle(request.getTitle());
        content.setBody(request.getBody());
        content.setCategory(testCategory);
        content.setAuthor(testUser);
        content.setSlug("new-content");

        when(categoryRepository.findById(testCategory.getId())).thenReturn(Optional.of(testCategory));
        when(contentRepository.save(any(Content.class))).thenReturn(content);

        // When
        ContentDto result = contentService.createContent(request);

        // Then
        assertNotNull(result);
        assertEquals("New Content", result.getTitle());
        assertEquals("testuser", result.getAuthor().getUsername());
        verify(contentRepository, times(1)).save(any(Content.class));
    }

    @Test
    void createContent_shouldThrowResourceNotFoundException_whenCategoryNotFound() {
        // Given
        ContentCreateRequest request = new ContentCreateRequest();
        request.setTitle("New Content");
        request.setBody("Content body here.");
        request.setCategoryId(99L); // Non-existent category
        request.setStatus(Content.ContentStatus.DRAFT);

        when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(ResourceNotFoundException.class, () -> contentService.createContent(request));
        verify(contentRepository, never()).save(any(Content.class));
    }

    @Test
    void getContentById_shouldReturnContentDto() {
        // Given
        Content content = new Content(1L, "Test Title", "Test Body", "test-title", Content.ContentStatus.PUBLISHED, testCategory, testUser, LocalDateTime.now(), LocalDateTime.now());
        when(contentRepository.findById(1L)).thenReturn(Optional.of(content));

        // When
        ContentDto result = contentService.getContentById(1L);

        // Then
        assertNotNull(result);
        assertEquals("Test Title", result.getTitle());
    }

    @Test
    void getContentById_shouldThrowResourceNotFoundException_whenContentNotFound() {
        // Given
        when(contentRepository.findById(99L)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(ResourceNotFoundException.class, () -> contentService.getContentById(99L));
    }

    @Test
    void updateContent_shouldReturnUpdatedContentDto() {
        // Given
        Content existingContent = new Content(1L, "Original Title", "Original Body", "original-title", Content.ContentStatus.DRAFT, testCategory, testUser, LocalDateTime.now(), LocalDateTime.now());
        ContentUpdateRequest request = new ContentUpdateRequest();
        request.setTitle("Updated Title");
        request.setBody("Updated Body");
        request.setStatus(Content.ContentStatus.PUBLISHED);

        Content updatedContent = new Content(1L, "Updated Title", "Updated Body", "updated-title", Content.ContentStatus.PUBLISHED, testCategory, testUser, LocalDateTime.now(), LocalDateTime.now());

        when(contentRepository.findById(1L)).thenReturn(Optional.of(existingContent));
        when(contentRepository.save(any(Content.class))).thenReturn(updatedContent);

        // When
        ContentDto result = contentService.updateContent(1L, request);

        // Then
        assertNotNull(result);
        assertEquals("Updated Title", result.getTitle());
        assertEquals(Content.ContentStatus.PUBLISHED, result.getStatus());
        verify(contentRepository, times(1)).save(any(Content.class));
    }

    @Test
    void deleteContent_shouldDeleteContent() {
        // Given
        when(contentRepository.existsById(1L)).thenReturn(true);
        doNothing().when(contentRepository).deleteById(1L);

        // When
        contentService.deleteContent(1L);

        // Then
        verify(contentRepository, times(1)).deleteById(1L);
    }

    @Test
    void deleteContent_shouldThrowResourceNotFoundException_whenContentNotFound() {
        // Given
        when(contentRepository.existsById(99L)).thenReturn(false);

        // When & Then
        assertThrows(ResourceNotFoundException.class, () -> contentService.deleteContent(99L));
        verify(contentRepository, never()).deleteById(anyLong());
    }
}