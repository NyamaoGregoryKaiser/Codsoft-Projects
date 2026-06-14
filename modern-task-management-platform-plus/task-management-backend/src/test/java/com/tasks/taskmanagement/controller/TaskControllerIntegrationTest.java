```java
package com.tasks.taskmanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tasks.taskmanagement.dto.AuthRequest;
import com.tasks.taskmanagement.dto.AuthResponse;
import com.tasks.taskmanagement.dto.TaskDTO;
import com.tasks.taskmanagement.entity.Task;
import com.tasks.taskmanagement.entity.User;
import com.tasks.taskmanagement.repository.ProjectRepository;
import com.tasks.taskmanagement.repository.TaskRepository;
import com.tasks.taskmanagement.repository.UserRepository;
import com.tasks.taskmanagement.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class TaskControllerIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15.3")
            .withDatabaseName("testdb")
            .withUsername("testuser")
            .withPassword("testpass");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop"); // Use create-drop for integration tests
        registry.add("spring.flyway.enabled", () -> "false"); // Disable Flyway for create-drop
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
    private TaskRepository taskRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider; // Used to manually create tokens for admin

    private String userToken;
    private String adminToken;
    private User regularUser;
    private User adminUser;
    private com.tasks.taskmanagement.entity.Project userProject;
    private com.tasks.taskmanagement.entity.Task userTask;

    @BeforeEach
    void setUp() throws Exception {
        taskRepository.deleteAll();
        projectRepository.deleteAll();
        userRepository.deleteAll();

        // Register and authenticate a regular user
        regularUser = User.builder()
                .username("testuser_int")
                .email("test_int@example.com")
                .password(passwordEncoder.encode("password"))
                .role(User.Role.USER)
                .build();
        regularUser = userRepository.save(regularUser);

        ResultActions authResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AuthRequest("testuser_int", "password"))))
                .andExpect(status().isOk());
        userToken = objectMapper.readValue(authResult.andReturn().getResponse().getContentAsString(), AuthResponse.class).getAccessToken();

        // Register and authenticate an admin user
        adminUser = User.builder()
                .username("admin_int")
                .email("admin_int@example.com")
                .password(passwordEncoder.encode("adminpass"))
                .role(User.Role.ADMIN)
                .build();
        adminUser = userRepository.save(adminUser);
        adminToken = jwtTokenProvider.generateToken(new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(adminUser, null, adminUser.getAuthorities()));


        // Create a project for the regular user
        userProject = com.tasks.taskmanagement.entity.Project.builder()
                .name("User Project")
                .description("Project for regular user")
                .owner(regularUser)
                .build();
        userProject = projectRepository.save(userProject);

        // Create a task for the regular user
        userTask = com.tasks.taskmanagement.entity.Task.builder()
                .title("User Task")
                .description("Description for user task")
                .status(Task.Status.PENDING)
                .priority(Task.Priority.MEDIUM)
                .dueDate(LocalDateTime.now().plusDays(5))
                .assignee(regularUser)
                .project(userProject)
                .build();
        userTask = taskRepository.save(userTask);
    }

    @Test
    @DisplayName("Should create a task successfully as authenticated user")
    void createTask_AuthenticatedUser() throws Exception {
        TaskDTO newTask = TaskDTO.builder()
                .title("New Task for User")
                .description("Description for new task")
                .status(Task.Status.PENDING)
                .priority(Task.Priority.LOW)
                .assigneeId(regularUser.getId())
                .projectId(userProject.getId())
                .dueDate(LocalDateTime.now().plusDays(10))
                .build();

        mockMvc.perform(post("/api/tasks")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newTask)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("New Task for User"))
                .andExpect(jsonPath("$.assignee.id").value(regularUser.getId().toString()));
    }

    @Test
    @DisplayName("Should not create a task without authentication")
    void createTask_Unauthenticated() throws Exception {
        TaskDTO newTask = TaskDTO.builder()
                .title("Unauthorized Task")
                .status(Task.Status.PENDING)
                .priority(Task.Priority.LOW)
                .build();

        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newTask)))
                .andExpect(status().isForbidden()); // 403 because /tasks is not public
    }

    @Test
    @DisplayName("Should get task by ID as assignee")
    void getTaskById_AsAssignee() throws Exception {
        mockMvc.perform(get("/api/tasks/{id}", userTask.getId())
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(userTask.getId().toString()))
                .andExpect(jsonPath("$.title").value("User Task"));
    }

    @Test
    @DisplayName("Should get task by ID as admin")
    void getTaskById_AsAdmin() throws Exception {
        mockMvc.perform(get("/api/tasks/{id}", userTask.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(userTask.getId().toString()))
                .andExpect(jsonPath("$.title").value("User Task"));
    }

    @Test
    @DisplayName("Should not get task by ID for unauthorized user")
    void getTaskById_UnauthorizedUser() throws Exception {
        // Create another user and try to access userTask
        User otherUser = User.builder()
                .username("other_user")
                .email("other@example.com")
                .password(passwordEncoder.encode("password"))
                .role(User.Role.USER)
                .build();
        userRepository.save(otherUser);
        ResultActions otherAuthResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AuthRequest("other_user", "password"))))
                .andExpect(status().isOk());
        String otherUserToken = objectMapper.readValue(otherAuthResult.andReturn().getResponse().getContentAsString(), AuthResponse.class).getAccessToken();

        mockMvc.perform(get("/api/tasks/{id}", userTask.getId())
                        .header("Authorization", "Bearer " + otherUserToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Should update task successfully as assignee")
    void updateTask_AsAssignee() throws Exception {
        TaskDTO updatedTask = TaskDTO.builder()
                .title("Updated User Task")
                .description("New description")
                .status(Task.Status.IN_PROGRESS)
                .priority(Task.Priority.HIGH)
                .dueDate(LocalDateTime.now().plusDays(7))
                .assigneeId(regularUser.getId()) // Must be same assignee or authorized to change
                .projectId(userProject.getId()) // Must be same project or authorized to change
                .build();

        mockMvc.perform(put("/api/tasks/{id}", userTask.getId())
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedTask)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated User Task"))
                .andExpect(jsonPath("$.status").value(Task.Status.IN_PROGRESS.name()));
    }

    @Test
    @DisplayName("Should delete task successfully as assignee")
    void deleteTask_AsAssignee() throws Exception {
        mockMvc.perform(delete("/api/tasks/{id}", userTask.getId())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/tasks/{id}", userTask.getId())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNotFound()); // Task should no longer exist
    }

    @Test
    @DisplayName("Should get all tasks as admin")
    void getAllTasks_AsAdmin() throws Exception {
        mockMvc.perform(get("/api/tasks")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1)) // Only userTask created
                .andExpect(jsonPath("$[0].title").value("User Task"));
    }

    @Test
    @DisplayName("Should get tasks for current user with filters")
    void getTasksForCurrentUser_WithFilters() throws Exception {
        // Create another task for the same user, but different status
        com.tasks.taskmanagement.entity.Task completedTask = com.tasks.taskmanagement.entity.Task.builder()
                .title("Completed User Task")
                .status(Task.Status.COMPLETED)
                .priority(Task.Priority.LOW)
                .assignee(regularUser)
                .project(userProject)
                .dueDate(LocalDateTime.now().minusDays(1))
                .build();
        taskRepository.save(completedTask);

        // Fetch PENDING tasks for the user
        mockMvc.perform(get("/api/tasks?status=PENDING")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("User Task")); // This task is PENDING
    }
}
```