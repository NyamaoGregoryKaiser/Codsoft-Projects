package com.projectpulse.projectpulse.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.projectpulse.projectpulse.auth.dto.AuthRequest;
import com.projectpulse.projectpulse.auth.dto.AuthResponse;
import com.projectpulse.projectpulse.project.dto.ProjectCreateDto;
import com.projectpulse.projectpulse.project.dto.ProjectDto;
import com.projectpulse.projectpulse.project.dto.ProjectUpdateDto;
import com.projectpulse.projectpulse.user.dto.UserRegisterDto;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
class ProjectPulseIntegrationTest {

    @Container
    private static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("testdb")
            .withUsername("testuser")
            .withPassword("testpassword");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop"); // Ensure schema is created
        registry.add("spring.sql.init.mode", () -> "always"); // Rerun schema/data.sql for each test env
        registry.add("spring.sql.init.schema-locations", () -> "classpath:db/schema.sql");
        registry.add("spring.sql.init.data-locations", () -> "classpath:db/data.sql");
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static String adminToken;
    private static String user1Token;

    @BeforeAll
    static void setUp(@Autowired MockMvc mockMvc, @Autowired ObjectMapper objectMapper) throws Exception {
        // Register a test user
        UserRegisterDto userRegisterDto = new UserRegisterDto();
        userRegisterDto.setUsername("test_user");
        userRegisterDto.setEmail("test_user@example.com");
        userRegisterDto.setPassword("test_password");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userRegisterDto)))
                .andExpect(status().isCreated());

        // Login as 'admin' (from data.sql) to get token
        AuthRequest adminAuth = new AuthRequest();
        adminAuth.setUsername("admin");
        adminAuth.setPassword("admin");
        MvcResult adminLoginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminAuth)))
                .andExpect(status().isOk())
                .andReturn();
        adminToken = objectMapper.readValue(adminLoginResult.getResponse().getContentAsString(), AuthResponse.class).getToken();

        // Login as 'user1' (from data.sql) to get token
        AuthRequest user1Auth = new AuthRequest();
        user1Auth.setUsername("user1");
        user1Auth.setPassword("password");
        MvcResult user1LoginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(user1Auth)))
                .andExpect(status().isOk())
                .andReturn();
        user1Token = objectMapper.readValue(user1LoginResult.getResponse().getContentAsString(), AuthResponse.class).getToken();
    }

    @Test
    void contextLoads() {
        assertNotNull(mockMvc);
        assertTrue(postgres.isRunning());
    }

    @Test
    void adminCanAccessAllUsers() throws Exception {
        mockMvc.perform(get("/api/v1/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(greaterThanOrEqualTo(3))); // 3 users in data.sql + 1 test_user
    }

    @Test
    void userCannotAccessAllUsers() throws Exception {
        mockMvc.perform(get("/api/v1/users")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isForbidden());
    }

    @Test
    void createProject_User1_Success() throws Exception {
        ProjectCreateDto createDto = new ProjectCreateDto();
        createDto.setName("New Project by User1");
        createDto.setDescription("Description by User1");

        MvcResult result = mockMvc.perform(post("/api/v1/projects")
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("New Project by User1"))
                .andReturn();

        ProjectDto createdProject = objectMapper.readValue(result.getResponse().getContentAsString(), ProjectDto.class);
        assertNotNull(createdProject.getId());

        // Verify it exists
        mockMvc.perform(get("/api/v1/projects/{id}", createdProject.getId())
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("New Project by User1"));
    }

    @Test
    void updateProject_User1OwnProject_Success() throws Exception {
        // First, create a project by user1
        ProjectCreateDto createDto = new ProjectCreateDto();
        createDto.setName("Temp Project for Update");
        createDto.setDescription("Initial description");
        MvcResult createResult = mockMvc.perform(post("/api/v1/projects")
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andReturn();
        ProjectDto createdProject = objectMapper.readValue(createResult.getResponse().getContentAsString(), ProjectDto.class);

        // Then update it
        ProjectUpdateDto updateDto = new ProjectUpdateDto();
        updateDto.setName("Updated Project Name by User1");
        mockMvc.perform(put("/api/v1/projects/{id}", createdProject.getId())
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Project Name by User1"));
    }

    @Test
    void deleteProject_User1OwnProject_Success() throws Exception {
        // First, create a project by user1
        ProjectCreateDto createDto = new ProjectCreateDto();
        createDto.setName("Temp Project for Delete");
        createDto.setDescription("Initial description");
        MvcResult createResult = mockMvc.perform(post("/api/v1/projects")
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andReturn();
        ProjectDto createdProject = objectMapper.readValue(createResult.getResponse().getContentAsString(), ProjectDto.class);

        // Then delete it
        mockMvc.perform(delete("/api/v1/projects/{id}", createdProject.getId())
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isNoContent());

        // Verify it's deleted
        mockMvc.perform(get("/api/v1/projects/{id}", createdProject.getId())
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isNotFound());
    }

    @Test
    void rateLimiting_TooManyRequests() throws Exception {
        // Attempt more requests than the rate limit (e.g., 10 per minute)
        // This test might be flaky depending on exact timing and number of requests.
        // It's more illustrative than a guaranteed pass in a fast test environment.
        for (int i = 0; i < 11; i++) { // 11 requests, 1 over the limit
            if (i < 10) {
                mockMvc.perform(get("/api/v1/projects").header("Authorization", "Bearer " + user1Token))
                        .andExpect(status().isOk());
            } else {
                mockMvc.perform(get("/api/v1/projects").header("Authorization", "Bearer " + user1Token))
                        .andExpect(status().isTooManyRequests());
            }
        }
    }
}
```

#### Frontend Tests (React)

**`frontend/src/tests/App.test.js`**
```javascript