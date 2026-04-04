package com.example.secureprojectmanagement.web;

import com.example.secureprojectmanagement.SecureProjectManagementApplication;
import com.example.secureprojectmanagement.model.Project;
import com.example.secureprojectmanagement.model.User;
import com.example.secureprojectmanagement.repository.ProjectRepository;
import com.example.secureprojectmanagement.repository.UserRepository;
import com.example.secureprojectmanagement.security.JwtTokenProvider;
import com.example.secureprojectmanagement.service.CustomUserDetailsService;
import com.example.secureprojectmanagement.web.dto.ProjectDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDate;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Testcontainers
@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    classes = SecureProjectManagementApplication.class
)
@AutoConfigureMockMvc
class ProjectControllerIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "update");
        registry.add("spring.liquibase.enabled", () -> "true");
        registry.add("spring.liquibase.change-log", () -> "classpath:db/changelog/db.changelog-master.xml");
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User testUser;
    private String jwtToken;

    @BeforeEach
    void setUp() {
        projectRepository.deleteAll(); // Clean up projects
        userRepository.deleteAll(); // Clean up users
        // Seed data for admin/user will run via Liquibase
        
        // Get the 'user' from seed data or create if not present
        testUser = userRepository.findByUsername("user").orElseGet(() -> {
            // This block should ideally not run if Liquibase seed is working
            // For robustness, create a user if not found
            User newUser = new User();
            newUser.setUsername("testuser_for_projects");
            newUser.setEmail("test_project@example.com");
            newUser.setPassword("$2a$10$B0/H5KqB8Y3X4oP9Q1d.G.jN.1n8gC8Q/wF5P/vX5oE2q1vY0d7pS"); // userpass
            return userRepository.save(newUser);
        });

        // Manually set authentication for JWT token generation
        UserDetails userDetails = userDetailsService.loadUserByUsername(testUser.getUsername());
        Authentication authentication = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        jwtToken = jwtTokenProvider.generateToken(authentication);

        // Ensure SecurityContext is cleared between tests
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        projectRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void getAllProjects_Authenticated_ReturnsProjects() throws Exception {
        Project project1 = new Project();
        project1.setName("Project Alpha");
        project1.setOwner(testUser);
        projectRepository.save(project1);

        Project project2 = new Project();
        project2.setName("Project Beta");
        project2.setOwner(testUser);
        projectRepository.save(project2);

        mockMvc.perform(get("/api/projects")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].name", is("Project Alpha")));
    }

    @Test
    void getProjectById_OwnerAccess_ReturnsProject() throws Exception {
        Project project = new Project();
        project.setName("Single Project");
        project.setOwner(testUser);
        Project savedProject = projectRepository.save(project);

        mockMvc.perform(get("/api/projects/{id}", savedProject.getId())
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Single Project")));
    }

    @Test
    void getProjectById_NotOwner_ReturnsForbidden() throws Exception {
        User otherUser = new User();
        otherUser.setUsername("otheruser");
        otherUser.setEmail("other@example.com");
        otherUser.setPassword("password");
        userRepository.save(otherUser);

        Project project = new Project();
        project.setName("Other User's Project");
        project.setOwner(otherUser);
        Project savedProject = projectRepository.save(project);

        mockMvc.perform(get("/api/projects/{id}", savedProject.getId())
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden()); // @PreAuthorize should deny access
    }

    @Test
    void createProject_ValidData_ReturnsCreated() throws Exception {
        ProjectDTO projectDTO = new ProjectDTO();
        projectDTO.setName("New Project");
        projectDTO.setDescription("A description");
        projectDTO.setStartDate(LocalDate.now());
        projectDTO.setEndDate(LocalDate.now().plusMonths(1));

        mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(projectDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("New Project")));
    }

    @Test
    void updateProject_OwnerAccess_ReturnsUpdatedProject() throws Exception {
        Project project = new Project();
        project.setName("Old Name");
        project.setOwner(testUser);
        Project savedProject = projectRepository.save(project);

        ProjectDTO projectDTO = new ProjectDTO();
        projectDTO.setName("Updated Name");
        projectDTO.setDescription("Updated description");
        projectDTO.setStartDate(LocalDate.now());
        projectDTO.setEndDate(LocalDate.now().plusMonths(2));

        mockMvc.perform(put("/api/projects/{id}", savedProject.getId())
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(projectDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Updated Name")));
    }

    @Test
    void deleteProject_OwnerAccess_ReturnsNoContent() throws Exception {
        Project project = new Project();
        project.setName("To Be Deleted");
        project.setOwner(testUser);
        Project savedProject = projectRepository.save(project);

        mockMvc.perform(delete("/api/projects/{id}", savedProject.getId())
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());

        assert (projectRepository.findById(savedProject.getId()).isEmpty());
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"}) // Use Spring Security's TestContext for admin
    void deleteProject_AdminAccess_ReturnsNoContent() throws Exception {
        // Create project owned by 'testUser', but deleted by 'admin'
        Project project = new Project();
        project.setName("Admin Delete Test");
        project.setOwner(testUser);
        Project savedProject = projectRepository.save(project);

        // Need JWT for API endpoints, even with @WithMockUser for roles.
        // Or configure MockMvc to simulate JWT. For simplicity, use admin from DB.
        User adminUser = userRepository.findByUsername("admin").orElseThrow();
        UserDetails adminDetails = userDetailsService.loadUserByUsername(adminUser.getUsername());
        Authentication adminAuth = new UsernamePasswordAuthenticationToken(adminDetails, null, adminDetails.getAuthorities());
        String adminJwtToken = jwtTokenProvider.generateToken(adminAuth);


        mockMvc.perform(delete("/api/projects/{id}", savedProject.getId())
                        .header("Authorization", "Bearer " + adminJwtToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());

        assert (projectRepository.findById(savedProject.getId()).isEmpty());
    }
}