```java
package com.taskflow.project.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskflow.auth.dto.LoginRequest;
import com.taskflow.auth.dto.LoginResponse;
import com.taskflow.project.dto.ProjectDTO;
import com.taskflow.user.dto.UserRegisterRequest;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
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

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class ProjectControllerIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.flyway.url", postgres::getJdbcUrl);
        registry.add("spring.flyway.user", postgres::getUsername);
        registry.add("spring.flyway.password", postgres::getPassword);
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static String adminToken;
    private static String userToken;
    private static UUID adminId;
    private static UUID userId;

    @BeforeAll
    static void setUpDatabaseAndUsers(@Autowired MockMvc mockMvc, @Autowired ObjectMapper objectMapper) throws Exception {
        // Register an admin user programmatically (assuming /api/auth/register doesn't need auth)
        UserRegisterRequest adminRegister = new UserRegisterRequest("integration_admin", "admin@integration.com", "password123");
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminRegister)))
                .andExpect(status().isCreated())
                .andReturn();

        // Login admin to get token and ID
        MvcResult adminLoginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("integration_admin", "password123"))))
                .andExpect(status().isOk())
                .andReturn();
        LoginResponse adminLoginResponse = objectMapper.readValue(adminLoginResult.getResponse().getContentAsString(), LoginResponse.class);
        adminToken = adminLoginResponse.getToken();
        adminId = adminLoginResponse.getId();


        // Register a regular user
        UserRegisterRequest userRegister = new UserRegisterRequest("integration_user", "user@integration.com", "password123");
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userRegister)))
                .andExpect(status().isCreated())
                .andReturn();

        // Login user to get token and ID
        MvcResult userLoginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("integration_user", "password123"))))
                .andExpect(status().isOk())
                .andReturn();
        LoginResponse userLoginResponse = objectMapper.readValue(userLoginResult.getResponse().getContentAsString(), LoginResponse.class);
        userToken = userLoginResponse.getToken();
        userId = userLoginResponse.getId();
    }

    @Test
    void createProject_AsAuthenticatedUser_ShouldReturnCreatedProject() throws Exception {
        ProjectDTO newProject = new ProjectDTO(null, "Test Project", "Description for test project", null, null, null);

        mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newProject)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.name").value("Test Project"))
                .andExpect(jsonPath("$.description").value("Description for test project"))
                .andExpect(jsonPath("$.owner.id").value(userId.toString()));
    }

    @Test
    void createProject_WithoutAuthentication_ShouldReturnUnauthorized() throws Exception {
        ProjectDTO newProject = new ProjectDTO(null, "Unauthorized Project", "Description", null, null, null);

        mockMvc.perform(post("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newProject)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getAllProjects_AsAuthenticatedUser_ShouldReturnProjects() throws Exception {
        // Create a project first
        ProjectDTO newProject = new ProjectDTO(null, "Another Test Project", "Description", null, null, null);
        mockMvc.perform(post("/api/projects")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newProject)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/projects")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.content[0].name").exists());
    }

    @Test
    void getProjectById_AsOwner_ShouldReturnProject() throws Exception {
        // Create a project as the user
        ProjectDTO newProject = new ProjectDTO(null, "Project to Find", "Description", null, null, null);
        MvcResult result = mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newProject)))
                .andExpect(status().isCreated())
                .andReturn();

        ProjectDTO createdProject = objectMapper.readValue(result.getResponse().getContentAsString(), ProjectDTO.class);
        UUID projectId = createdProject.getId();

        mockMvc.perform(get("/api/projects/{id}", projectId)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(projectId.toString()))
                .andExpect(jsonPath("$.name").value("Project to Find"));
    }

    @Test
    void getProjectById_AsNonOwner_ShouldReturnForbidden() throws Exception {
        // Create a project as admin
        ProjectDTO adminProject = new ProjectDTO(null, "Admin's Project", "Admin description", null, null, null);
        MvcResult adminResult = mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminProject)))
                .andExpect(status().isCreated())
                .andReturn();
        ProjectDTO createdAdminProject = objectMapper.readValue(adminResult.getResponse().getContentAsString(), ProjectDTO.class);
        UUID adminProjectId = createdAdminProject.getId();

        // Try to access admin's project as a regular user
        mockMvc.perform(get("/api/projects/{id}", adminProjectId)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }


    @Test
    void updateProject_AsOwner_ShouldUpdateProject() throws Exception {
        // Create a project first
        ProjectDTO newProject = new ProjectDTO(null, "Project to Update", "Initial Description", null, null, null);
        MvcResult result = mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newProject)))
                .andExpect(status().isCreated())
                .andReturn();

        ProjectDTO createdProject = objectMapper.readValue(result.getResponse().getContentAsString(), ProjectDTO.class);
        UUID projectId = createdProject.getId();

        // Update the project
        createdProject.setName("Updated Project Name");
        createdProject.setDescription("Updated Description");

        mockMvc.perform(put("/api/projects/{id}", projectId)
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createdProject)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Project Name"))
                .andExpect(jsonPath("$.description").value("Updated Description"));
    }

    @Test
    void updateProject_AsNonOwner_ShouldReturnForbidden() throws Exception {
        // Create project as admin
        ProjectDTO adminProject = new ProjectDTO(null, "Admin Project to Update", "Initial", null, null, null);
        MvcResult adminResult = mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminProject)))
                .andExpect(status().isCreated())
                .andReturn();
        ProjectDTO createdAdminProject = objectMapper.readValue(adminResult.getResponse().getContentAsString(), ProjectDTO.class);
        UUID adminProjectId = createdAdminProject.getId();

        // Try to update as regular user
        ProjectDTO updatePayload = new ProjectDTO(null, "Attempted Update", "New Desc", null, null, null);
        mockMvc.perform(put("/api/projects/{id}", adminProjectId)
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatePayload)))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteProject_AsOwner_ShouldDeleteProject() throws Exception {
        // Create a project first
        ProjectDTO newProject = new ProjectDTO(null, "Project to Delete", "Description", null, null, null);
        MvcResult result = mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newProject)))
                .andExpect(status().isCreated())
                .andReturn();

        ProjectDTO createdProject = objectMapper.readValue(result.getResponse().getContentAsString(), ProjectDTO.class);
        UUID projectId = createdProject.getId();

        mockMvc.perform(delete("/api/projects/{id}", projectId)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNoContent());

        // Verify deletion
        mockMvc.perform(get("/api/projects/{id}", projectId)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden()); // Forbidden because owner check will fail
    }

    @Test
    void deleteProject_AsNonOwner_ShouldReturnForbidden() throws Exception {
        // Create project as admin
        ProjectDTO adminProject = new ProjectDTO(null, "Admin Project to Delete", "Initial", null, null, null);
        MvcResult adminResult = mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminProject)))
                .andExpect(status().isCreated())
                .andReturn();
        ProjectDTO createdAdminProject = objectMapper.readValue(adminResult.getResponse().getContentAsString(), ProjectDTO.class);
        UUID adminProjectId = createdAdminProject.getId();

        // Try to delete as regular user
        mockMvc.perform(delete("/api/projects/{id}", adminProjectId)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }
}
```