```java
package com.cms.example.content;

import com.cms.example.category.Category;
import com.cms.example.category.CategoryRepository;
import com.cms.example.exception.ResourceNotFoundException;
import com.cms.example.user.Role;
import com.cms.example.user.User;
import com.cms.example.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ContentServiceTest {

    @Mock
    private ContentRepository contentRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private ContentService contentService;

    private User author;
    private Category category;
    private Content content;
    private ContentDTO contentDTO;

    @BeforeEach
    void setUp() {
        author = User.builder()
                .id(1L)
                .firstName("Test")
                .lastName("Author")
                .email("author@example.com")
                .password("password")
                .role(Role.EDITOR)
                .createdAt(LocalDateTime.now())
                .build();

        category = Category.builder()
                .id(1L)
                .name("Technology")
                .slug("technology")
                .createdAt(LocalDateTime.now())
                .build();

        content = Content.builder()
                .id(1L)
                .title("Test Content")
                .slug("test-content")
                .body("This is a test content body.")
                .status(ContentStatus.DRAFT)
                .type(ContentType.POST)
                .author(author)
                .category(category)
                .createdAt(LocalDateTime.now())
                .build();

        contentDTO = ContentDTO.builder()
                .id(1L)
                .title("Test Content")
                .slug("test-content")
                .body("This is a test content body.")
                .status(ContentStatus.DRAFT)
                .type(ContentType.POST)
                .authorId(1L)
                .categoryId(1L)
                .build();
    }

    @Test
    void getContentById_shouldReturnContentDTO_whenContentExists() {
        when(contentRepository.findById(1L)).thenReturn(Optional.of(content));

        Optional<ContentDTO> result = contentService.getContentById(1L);

        assertThat(result).isPresent();
        assertThat(result.get().getTitle()).isEqualTo(content.getTitle());
    }

    @Test
    void getContentById_shouldReturnEmpty_whenContentDoesNotExist() {
        when(contentRepository.findById(anyLong())).thenReturn(Optional.empty());

        Optional<ContentDTO> result = contentService.getContentById(99L);

        assertThat(result).isNotPresent();
    }

    @Test
    void getPublishedContent_shouldReturnPageOfContentDTOs() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Content> contentPage = new PageImpl<>(List.of(content), pageable, 1);
        when(contentRepository.findByStatus(ContentStatus.PUBLISHED, pageable)).thenReturn(contentPage);

        Page<ContentDTO> result = contentService.getPublishedContent(0, 10, "publishedAt");

        assertThat(result).hasSize(1);
        assertThat(result.getContent().get(0).getTitle()).isEqualTo(content.getTitle());
    }

    @Test
    void createContent_shouldReturnCreatedContentDTO() {
        when(contentRepository.existsByTitle(anyString())).thenReturn(false);
        when(contentRepository.existsBySlug(anyString())).thenReturn(false);
        when(userRepository.findById(1L)).thenReturn(Optional.of(author));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(contentRepository.save(any(Content.class))).thenReturn(content);

        ContentDTO result = contentService.createContent(contentDTO, 1L);

        assertThat(result).isNotNull();
        assertThat(result.getTitle()).isEqualTo(contentDTO.getTitle());
        verify(contentRepository, times(1)).save(any(Content.class));
    }

    @Test
    void createContent_shouldThrowException_whenTitleExists() {
        when(contentRepository.existsByTitle(anyString())).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> contentService.createContent(contentDTO, 1L));
        verify(contentRepository, never()).save(any(Content.class));
    }

    @Test
    void updateContent_shouldReturnUpdatedContentDTO() {
        when(contentRepository.findById(1L)).thenReturn(Optional.of(content));
        when(contentRepository.existsByTitle(anyString())).thenReturn(false); // Assume title is not changed or unique
        when(contentRepository.existsBySlug(anyString())).thenReturn(false); // Assume slug is not changed or unique
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(contentRepository.save(any(Content.class))).thenReturn(content); // Return the updated entity

        contentDTO.setTitle("Updated Title");
        ContentDTO result = contentService.updateContent(1L, contentDTO);

        assertThat(result).isNotNull();
        assertThat(result.getTitle()).isEqualTo("Updated Title");
        verify(contentRepository, times(1)).save(any(Content.class));
    }

    @Test
    void updateContent_shouldThrowException_whenContentNotFound() {
        when(contentRepository.findById(anyLong())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> contentService.updateContent(99L, contentDTO));
        verify(contentRepository, never()).save(any(Content.class));
    }

    @Test
    void deleteContent_shouldDeleteContent_whenContentExists() {
        when(contentRepository.existsById(1L)).thenReturn(true);
        doNothing().when(contentRepository).deleteById(1L);

        contentService.deleteContent(1L);

        verify(contentRepository, times(1)).deleteById(1L);
    }

    @Test
    void deleteContent_shouldThrowException_whenContentNotFound() {
        when(contentRepository.existsById(anyLong())).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> contentService.deleteContent(99L));
        verify(contentRepository, never()).deleteById(anyLong());
    }

    @Test
    void isContentAuthor_shouldReturnTrue_whenUserIsAuthor() {
        when(contentRepository.findById(1L)).thenReturn(Optional.of(content));
        assertThat(contentService.isContentAuthor(1L, 1L)).isTrue();
    }

    @Test
    void isContentAuthor_shouldReturnFalse_whenUserIsNotAuthor() {
        when(contentRepository.findById(1L)).thenReturn(Optional.of(content));
        assertThat(contentService.isContentAuthor(1L, 2L)).isFalse();
    }

    @Test
    void isContentAuthor_shouldReturnFalse_whenContentNotFound() {
        when(contentRepository.findById(anyLong())).thenReturn(Optional.empty());
        assertThat(contentService.isContentAuthor(99L, 1L)).isFalse();
    }
}
```