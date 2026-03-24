package com.taskmanager.system.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskmanager.system.dto.auth.LoginDto;
import com.taskmanager.system.dto.project.ProjectRequest;
import com.taskmanager.system.repository.ProjectRepository;
import com.taskmanager.system.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
class ProjectControllerIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(DockerImageName.parse("postgres:15-alpine"))
            .withDatabaseName("testdb")
            .withUsername("testuser")
            .withPassword("testpass");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop"); // For integration tests
        registry.add("spring.flyway.enabled", () -> "true"); // Enable Flyway for tests
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    private String adminJwtToken;
    private String userJwtToken;

    @BeforeEach
    void setUp() throws Exception {
        // Clear database before each test
        projectRepository.deleteAll();
        userRepository.deleteAll(); // This will also delete roles if cascade is set or handle carefully

        // Ensure roles and initial users are seeded by Flyway or a setup script
        // For simplicity, re-run Flyway migrations or add a setup method here
        // If ddl-auto is create-drop, Flyway will run on app context startup

        // Manual setup for users (if not relying solely on Flyway seed for tests)
        // Authenticate admin user
        LoginDto adminLoginDto = new LoginDto();
        adminLoginDto.setUsernameOrEmail("admin@task.com"); // Assuming this is from seed data
        adminLoginDto.setPassword("admin");

        MvcResult adminLoginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLoginDto)))
                .andExpect(status().isOk())
                .andReturn();
        adminJwtToken = objectMapper.readTree(adminLoginResult.getResponse().getContentAsString()).get("accessToken").asText();

        // Authenticate regular user
        LoginDto userLoginDto = new LoginDto();
        userLoginDto.setUsernameOrEmail("user@task.com"); // Assuming this is from seed data
        userLoginDto.setPassword("user");

        MvcResult userLoginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userLoginDto)))
                .andExpect(status().isOk())
                .andReturn();
        userJwtToken = objectMapper.readTree(userLoginResult.getResponse().getContentAsString()).get("accessToken").asText();
    }


    @DisplayName("Create Project - Success for authenticated user")
    @Test
    void testCreateProject_Success() throws Exception {
        ProjectRequest projectRequest = new ProjectRequest();
        projectRequest.setName("New Test Project");
        projectRequest.setDescription("Description for new project.");

        mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + userJwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(projectRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("New Test Project"))
                .andExpect(jsonPath("$.description").value("Description for new project."));
    }

    @DisplayName("Get All Projects - Success")
    @Test
    void testGetAllProjects_Success() throws Exception {
        // First create a project using the user token
        ProjectRequest projectRequest = new ProjectRequest("Another Project", "Some Description");
        mockMvc.perform(post("/api/projects")
                .header("Authorization", "Bearer " + userJwtToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(projectRequest)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/projects")
                        .header("Authorization", "Bearer " + userJwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].name").value("Another Project"));
    }

    @DisplayName("Update Project - Success for owner")
    @Test
    void testUpdateProject_Success() throws Exception {
        // Create project first
        ProjectRequest createRequest = new ProjectRequest("Project to Update", "Initial description");
        MvcResult createResult = mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + userJwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        Long projectId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        ProjectRequest updateRequest = new ProjectRequest("Updated Project Name", "Updated description");

        mockMvc.perform(put("/api/projects/{id}", projectId)
                        .header("Authorization", "Bearer " + userJwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Project Name"))
                .andExpect(jsonPath("$.description").value("Updated description"));
    }

    @DisplayName("Delete Project - Success for owner")
    @Test
    void testDeleteProject_Success() throws Exception {
        // Create project first
        ProjectRequest createRequest = new ProjectRequest("Project to Delete", "Description");
        MvcResult createResult = mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + userJwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        Long projectId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(delete("/api/projects/{id}", projectId)
                        .header("Authorization", "Bearer " + userJwtToken))
                .andExpect(status().isOk())
                .andExpect(content().string("Project deleted successfully."));

        mockMvc.perform(get("/api/projects/{id}", projectId)
                        .header("Authorization", "Bearer " + userJwtToken))
                .andExpect(status().isNotFound()); // Should be deleted
    }
}