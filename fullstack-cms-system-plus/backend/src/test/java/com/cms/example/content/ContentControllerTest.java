```java
package com.cms.example.content;

import com.cms.example.auth.AuthenticationRequest;
import com.cms.example.auth.AuthenticationService;
import com.cms.example.auth.RegisterRequest;
import com.cms.example.config.ApplicationConfig;
import com.cms.example.config.JwtAuthenticationFilter;
import com.cms.example.config.RateLimitFilter;
import com.cms.example.config.SecurityConfiguration;
import com.cms.example.exception.ResourceNotFoundException;
import com.cms.example.user.Role;
import com.cms.example.user.User;
import com.cms.example.user.UserRepository;
import com.cms.example.user.UserService;
import com.cms.example.util.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Use @WebMvcTest for testing Spring MVC controllers. It loads only the web layer.
// We need to import our security config explicitly, and mock necessary beans.
@WebMvcTest(ContentController.class)
@Import({SecurityConfiguration.class, ApplicationConfig.class, JwtAuthenticationFilter.class, RateLimitFilter.class})
class ContentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ContentService contentService;

    @MockBean
    private UserService userService; // Required by ApplicationConfig/SecurityConfiguration
    @MockBean
    private UserRepository userRepository; // Required by ApplicationConfig/UserService

    // Mock beans required for SecurityConfiguration and JwtAuthenticationFilter
    @MockBean
    private AuthenticationService authenticationService;
    @MockBean
    private JwtService jwtService;
    @MockBean
    private AuthenticationManager authenticationManager;

    private User adminUser;
    private User editorUser;
    private ContentDTO publishedContentDTO;
    private ContentDTO draftContentDTO;

    @BeforeEach
    void setUp() {
        adminUser = User.builder()
                .id(1L)
                .firstName("Admin")
                .lastName("User")
                .email("admin@example.com")
                .password("password") // Password is not used in controller tests, but mocked for context
                .role(Role.ADMIN)
                .build();

        editorUser = User.builder()
                .id(2L)
                .firstName("Editor")
                .lastName("User")
                .email("editor@example.com")
                .password("password")
                .role(Role.EDITOR)
                .build();

        publishedContentDTO = ContentDTO.builder()
                .id(1L)
                .title("Published Post")
                .slug("published-post")
                .body("This is a published post.")
                .status(ContentStatus.PUBLISHED)
                .type(ContentType.POST)
                .authorId(adminUser.getId())
                .authorName(adminUser.getFirstName() + " " + adminUser.getLastName())
                .createdAt(LocalDateTime.now())
                .publishedAt(LocalDateTime.now())
                .build();

        draftContentDTO = ContentDTO.builder()
                .id(2L)
                .title("Draft Page")
                .slug("draft-page")
                .body("This is a draft page.")
                .status(ContentStatus.DRAFT)
                .type(ContentType.PAGE)
                .authorId(editorUser.getId())
                .authorName(editorUser.getFirstName() + " " + editorUser.getLastName())
                .createdAt(LocalDateTime.now())
                .build();

        // Mock UserDetailsService for @AuthenticationPrincipal resolution
        when(userService.loadUserByUsername(anyString())).thenReturn(adminUser);
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(adminUser));
        when(userRepository.findById(anyLong())).thenReturn(Optional.of(adminUser));
    }

    @Test
    void getPublishedContent_shouldReturnPublishedContent() throws Exception {
        when(contentService.getPublishedContent(0, 10, "publishedAt"))
                .thenReturn(new PageImpl<>(List.of(publishedContentDTO)));

        mockMvc.perform(get("/api/v1/content/public")
                        .param("page", "0")
                        .param("size", "10")
                        .param("sortBy", "publishedAt")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title").value(publishedContentDTO.getTitle()));
    }

    @Test
    void getPublishedContentBySlug_shouldReturnPublishedContent() throws Exception {
        when(contentService.getContentBySlugAndStatus("published-post", ContentStatus.PUBLISHED))
                .thenReturn(Optional.of(publishedContentDTO));

        mockMvc.perform(get("/api/v1/content/public/published-post")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value(publishedContentDTO.getTitle()));
    }

    @Test
    void getPublishedContentBySlug_shouldReturnNotFound_ifNotPublished() throws Exception {
        when(contentService.getContentBySlugAndStatus("draft-page", ContentStatus.PUBLISHED))
                .thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/content/public/draft-page")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    void getAllContent_shouldReturnAllContentForAuthenticatedUsers() throws Exception {
        when(contentService.getAllContent(0, 10, "createdAt"))
                .thenReturn(new PageImpl<>(List.of(publishedContentDTO, draftContentDTO)));

        mockMvc.perform(get("/api/v1/content")
                        .param("page", "0")
                        .param("size", "10")
                        .param("sortBy", "createdAt")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.content[0].title").value(publishedContentDTO.getTitle()))
                .andExpect(jsonPath("$.content[1].title").value(draftContentDTO.getTitle()));
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    void getContentById_shouldReturnContent() throws Exception {
        when(contentService.getContentById(1L)).thenReturn(Optional.of(publishedContentDTO));

        mockMvc.perform(get("/api/v1/content/{id}", 1L)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value(publishedContentDTO.getTitle()));
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    void getContentById_shouldReturnNotFound_ifNotExists() throws Exception {
        when(contentService.getContentById(anyLong())).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/content/{id}", 99L)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    void createContent_shouldReturnCreatedContent() throws Exception {
        ContentDTO newContentRequest = ContentDTO.builder()
                .title("New Post")
                .slug("new-post")
                .body("This is a new post.")
                .status(ContentStatus.DRAFT)
                .type(ContentType.POST)
                .categoryId(1L)
                .build();
        ContentDTO createdContent = ContentDTO.builder()
                .id(3L).title("New Post").slug("new-post").body("This is a new post.")
                .status(ContentStatus.DRAFT).type(ContentType.POST).authorId(adminUser.getId())
                .build();

        when(contentService.createContent(any(ContentDTO.class), anyLong())).thenReturn(createdContent);

        mockMvc.perform(post("/api/v1/content")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newContentRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("New Post"));
    }

    @Test
    @WithMockUser(username = "editor@example.com", roles = {"EDITOR"})
    void updateContent_shouldReturnUpdatedContent() throws Exception {
        ContentDTO updatedContentRequest = ContentDTO.builder()
                .id(publishedContentDTO.getId())
                .title("Updated Title")
                .slug("updated-title")
                .body("Updated body.")
                .status(ContentStatus.PUBLISHED)
                .type(ContentType.POST)
                .categoryId(1L)
                .build();
        ContentDTO updatedContentResponse = ContentDTO.builder()
                .id(publishedContentDTO.getId()).title("Updated Title").slug("updated-title").body("Updated body.")
                .status(ContentStatus.PUBLISHED).type(ContentType.POST).authorId(editorUser.getId())
                .build();

        when(contentService.updateContent(anyLong(), any(ContentDTO.class))).thenReturn(updatedContentResponse);
        when(contentService.isContentAuthor(anyLong(), anyLong())).thenReturn(true); // For @PreAuthorize

        mockMvc.perform(put("/api/v1/content/{id}", publishedContentDTO.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedContentRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated Title"));
    }

    @Test
    @WithMockUser(username = "editor@example.com", roles = {"EDITOR"})
    void updateContent_shouldReturnForbidden_whenNotAuthorAndNotAdmin() throws Exception {
        ContentDTO updatedContentRequest = ContentDTO.builder()
                .id(publishedContentDTO.getId())
                .title("Updated Title")
                .body("Updated body.")
                .status(ContentStatus.PUBLISHED)
                .type(ContentType.POST)
                .categoryId(1L)
                .build();

        // Simulate editor trying to update content not authored by them
        when(contentService.isContentAuthor(anyLong(), anyLong())).thenReturn(false);
        // And mock the update call to throw AccessDeniedException due to @PreAuthorize
        doThrow(new org.springframework.security.access.AccessDeniedException("Access Denied"))
                .when(contentService).updateContent(anyLong(), any(ContentDTO.class));


        mockMvc.perform(put("/api/v1/content/{id}", publishedContentDTO.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedContentRequest)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    void deleteContent_shouldReturnNoContent() throws Exception {
        doNothing().when(contentService).deleteContent(1L);
        when(contentService.isContentAuthor(anyLong(), anyLong())).thenReturn(false); // For @PreAuthorize

        mockMvc.perform(delete("/api/v1/content/{id}", 1L)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = {"USER"})
    void deleteContent_shouldReturnForbidden_forUserRole() throws Exception {
        // Even if isContentAuthor returns true, the @PreAuthorize("hasAnyAuthority('ADMIN', 'EDITOR')") will deny it for USER role
        when(contentService.isContentAuthor(anyLong(), anyLong())).thenReturn(true);
        doThrow(new org.springframework.security.access.AccessDeniedException("Access Denied"))
                .when(contentService).deleteContent(anyLong());

        mockMvc.perform(delete("/api/v1/content/{id}", 1L)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }
}
```