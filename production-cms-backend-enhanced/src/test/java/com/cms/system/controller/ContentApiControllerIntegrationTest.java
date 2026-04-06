package com.cms.system.controller;

import com.cms.system.dto.auth.LoginRequest;
import com.cms.system.dto.content.ContentCreateRequest;
import com.cms.system.dto.content.ContentDto;
import com.cms.system.dto.content.ContentUpdateRequest;
import com.cms.system.model.Category;
import com.cms.system.model.Content;
import com.cms.system.model.Role;
import com.cms.system.model.User;
import com.cms.system.repository.CategoryRepository;
import com.cms.system.repository.ContentRepository;
import com.cms.system.repository.RoleRepository;
import com.cms.system.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

import static com.cms.system.model.Role.ERole.*;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test") // Use the test profile for H2 database
@Transactional // Rollback transactions after each test
@DisplayName("ContentApiController Integration Tests")
class ContentApiControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ContentRepository contentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String adminToken;
    private User adminUser;
    private Category testCategory;

    @BeforeEach
    void setUp() throws Exception {
        // Clear repositories (Transactional annotation should handle this, but good for explicit setup)
        contentRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();
        roleRepository.deleteAll();

        // Setup roles
        Role userRole = roleRepository.save(new Role(null, ROLE_USER));
        Role editorRole = roleRepository.save(new Role(null, ROLE_EDITOR));
        Role adminRole = roleRepository.save(new Role(null, ROLE_ADMIN));

        // Create an Admin user
        adminUser = new User();
        adminUser.setUsername("admin");
        adminUser.setEmail("admin@example.com");
        adminUser.setPassword(passwordEncoder.encode("adminpass"));
        adminUser.setRoles(Set.of(adminRole, editorRole, userRole));
        userRepository.save(adminUser);

        // Login as admin and get JWT token
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("admin");
        loginRequest.setPassword("adminpass");

        MvcResult result = mockMvc.perform(post("/api/auth/signin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String responseString = result.getResponse().getContentAsString();
        adminToken = objectMapper.readTree(responseString).get("token").asText();

        // Create a category for content
        testCategory = new Category();
        testCategory.setName("Programming");
        testCategory.setDescription("Articles about programming languages and development.");
        categoryRepository.save(testCategory);
    }

    @Test
    void createContent_shouldReturnCreatedContent_whenAuthenticatedAsAdmin() throws Exception {
        ContentCreateRequest request = new ContentCreateRequest();
        request.setTitle("My First Blog Post");
        request.setBody("This is the body of my first blog post.");
        request.setCategoryId(testCategory.getId());
        request.setStatus(Content.ContentStatus.DRAFT);

        mockMvc.perform(post("/api/content")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title", is("My First Blog Post")))
                .andExpect(jsonPath("$.category.name", is("Programming")))
                .andExpect(jsonPath("$.author.username", is("admin")));
    }

    @Test
    void getContentById_shouldReturnContent() throws Exception {
        Content newContent = new Content();
        newContent.setTitle("Existing Content");
        newContent.setBody("Some body text.");
        newContent.setCategory(testCategory);
        newContent.setAuthor(adminUser);
        newContent.setStatus(Content.ContentStatus.PUBLISHED);
        contentRepository.save(newContent);

        mockMvc.perform(get("/api/content/{id}", newContent.getId())
                        .header("Authorization", "Bearer " + adminToken) // Can be accessed by anyone, but good to include token
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Existing Content")));
    }

    @Test
    void updateContent_shouldReturnUpdatedContent_whenAuthenticatedAsAdmin() throws Exception {
        Content existingContent = new Content();
        existingContent.setTitle("Old Title");
        existingContent.setBody("Old Body");
        existingContent.setCategory(testCategory);
        existingContent.setAuthor(adminUser);
        existingContent.setStatus(Content.ContentStatus.DRAFT);
        contentRepository.save(existingContent);

        ContentUpdateRequest updateRequest = new ContentUpdateRequest();
        updateRequest.setTitle("New Title");
        updateRequest.setBody("New Body");
        updateRequest.setStatus(Content.ContentStatus.PUBLISHED);

        mockMvc.perform(put("/api/content/{id}", existingContent.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("New Title")))
                .andExpect(jsonPath("$.body", is("New Body")))
                .andExpect(jsonPath("$.status", is("PUBLISHED")));
    }

    @Test
    void deleteContent_shouldReturnNoContent_whenAuthenticatedAsAdmin() throws Exception {
        Content existingContent = new Content();
        existingContent.setTitle("To Be Deleted");
        existingContent.setBody("Content that will be deleted.");
        existingContent.setCategory(testCategory);
        existingContent.setAuthor(adminUser);
        existingContent.setStatus(Content.ContentStatus.DRAFT);
        contentRepository.save(existingContent);

        mockMvc.perform(delete("/api/content/{id}", existingContent.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/content/{id}", existingContent.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound()); // Verify it's gone
    }

    @Test
    void createContent_shouldReturnForbidden_whenNotAuthenticated() throws Exception {
        ContentCreateRequest request = new ContentCreateRequest();
        request.setTitle("Unauthorized Post");
        request.setBody("Body.");
        request.setCategoryId(testCategory.getId());
        request.setStatus(Content.ContentStatus.DRAFT);

        mockMvc.perform(post("/api/content")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized()); // Or 403 Forbidden depending on security config
    }
}