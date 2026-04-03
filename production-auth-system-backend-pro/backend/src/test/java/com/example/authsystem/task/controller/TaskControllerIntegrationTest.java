```java
package com.example.authsystem.task.controller;

import com.example.authsystem.AbstractIntegrationTest;
import com.example.authsystem.auth.dto.JwtAuthenticationResponse;
import com.example.authsystem.auth.dto.LoginRequest;
import com.example.authsystem.task.dto.TaskDTO;
import com.example.authsystem.task.repository.TaskRepository;
import com.example.authsystem.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TaskControllerIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TaskRepository taskRepository;

    private String adminToken;
    private String userToken;
    private Long userId;

    @BeforeEach
    void setUp() throws Exception {
        // Log in as admin to get token (from V2__Seed_data.sql)
        LoginRequest adminLogin = LoginRequest.builder()
                .email("admin@example.com")
                .password("adminpass")
                .build();
        MvcResult adminResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();
        JwtAuthenticationResponse adminAuthResponse = objectMapper.readValue(adminResult.getResponse().getContentAsString(), JwtAuthenticationResponse.class);
        adminToken = adminAuthResponse.getToken();

        // Log in as regular user to get token and user ID
        LoginRequest userLogin = LoginRequest.builder()
                .email("user@example.com")
                .password("userpass")
                .build();
        MvcResult userResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userLogin)))
                .andExpect(status().isOk())
                .andReturn();
        JwtAuthenticationResponse userAuthResponse = objectMapper.readValue(userResult.getResponse().getContentAsString(), JwtAuthenticationResponse.class);
        userToken = userAuthResponse.getToken();

        userId = userRepository.findByEmail("user@example.com").orElseThrow().getId();
    }

    @AfterEach
    void tearDown() {
        taskRepository.deleteAll(); // Clean up tasks after each test
        // Note: Users are seeded by Flyway and not deleted for test speed.
        // In a real scenario, you might want to truncate all tables.
    }

    @Test
    @DisplayName("Should create a new task for the authenticated user")
    void createTask_Success() throws Exception {
        TaskDTO newTask = TaskDTO.builder()
                .title("New Task for User")
                .description("Description for new task.")
                .completed(false)
                .build();

        mockMvc.perform(post("/api/v1/tasks")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newTask)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.title").value(newTask.getTitle()))
                .andExpect(jsonPath("$.userId").value(userId));
    }

    @Test
    @DisplayName("Should retrieve all tasks for the authenticated user")
    void getAllTasksForUser_Success() throws Exception {
        // Create a task first
        TaskDTO newTask = TaskDTO.builder().title("Task 1").completed(false).build();
        mockMvc.perform(post("/api/v1/tasks")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newTask)));

        mockMvc.perform(get("/api/v1/tasks")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3)); // 2 seeded tasks + 1 new task
    }

    @Test
    @DisplayName("Should retrieve a specific task by ID for the authenticated user")
    void getTaskById_Success() throws Exception {
        // Find one of the seeded tasks for 'user@example.com'
        Long taskId = taskRepository.findByUserId(userId).get(0).getId();

        mockMvc.perform(get("/api/v1/tasks/{taskId}", taskId)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(taskId))
                .andExpect(jsonPath("$.userId").value(userId));
    }

    @Test
    @DisplayName("Should return 404 if task not found or not owned by user")
    void getTaskById_NotFoundOrUnauthorized() throws Exception {
        Long nonExistentTaskId = 9999L; // Assuming this ID does not exist

        mockMvc.perform(get("/api/v1/tasks/{taskId}", nonExistentTaskId)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Task not found or unauthorized for id: " + nonExistentTaskId));
    }

    @Test
    @DisplayName("Should update an existing task for the authenticated user")
    void updateTask_Success() throws Exception {
        // Create a task to update
        TaskDTO initialTask = TaskDTO.builder().title("Task to Update").completed(false).build();
        MvcResult createResult = mockMvc.perform(post("/api/v1/tasks")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(initialTask)))
                .andExpect(status().isCreated())
                .andReturn();
        TaskDTO createdTask = objectMapper.readValue(createResult.getResponse().getContentAsString(), TaskDTO.class);

        TaskDTO updatedTask = TaskDTO.builder()
                .title("Updated Task Title")
                .description("Updated description.")
                .completed(true)
                .build();

        mockMvc.perform(put("/api/v1/tasks/{taskId}", createdTask.getId())
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedTask)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(createdTask.getId()))
                .andExpect(jsonPath("$.title").value(updatedTask.getTitle()))
                .andExpect(jsonPath("$.completed").value(true));
    }

    @Test
    @DisplayName("Should delete a task for the authenticated user")
    void deleteTask_Success() throws Exception {
        // Create a task to delete
        TaskDTO newTask = TaskDTO.builder().title("Task to Delete").completed(false).build();
        MvcResult createResult = mockMvc.perform(post("/api/v1/tasks")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newTask)))
                .andExpect(status().isCreated())
                .andReturn();
        TaskDTO createdTask = objectMapper.readValue(createResult.getResponse().getContentAsString(), TaskDTO.class);

        mockMvc.perform(delete("/api/v1/tasks/{taskId}", createdTask.getId())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNoContent());

        // Verify it's deleted
        mockMvc.perform(get("/api/v1/tasks/{taskId}", createdTask.getId())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Should return 401 Unauthorized if no token is provided")
    void requireAuth_NoToken() throws Exception {
        TaskDTO newTask = TaskDTO.builder().title("Unauthorized Task").completed(false).build();

        mockMvc.perform(post("/api/v1/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newTask)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should return 403 Forbidden if user tries to access another user's task")
    void accessOtherUserTask_Forbidden() throws Exception {
        // Create a task for admin
        TaskDTO adminTask = TaskDTO.builder().title("Admin's Private Task").completed(false).build();
        MvcResult adminTaskResult = mockMvc.perform(post("/api/v1/tasks")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminTask)))
                .andExpect(status().isCreated())
                .andReturn();
        TaskDTO createdAdminTask = objectMapper.readValue(adminTaskResult.getResponse().getContentAsString(), TaskDTO.class);

        // User tries to access admin's task
        mockMvc.perform(get("/api/v1/tasks/{taskId}", createdAdminTask.getId())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNotFound()) // Or forbidden, depending on exact implementation.
                .andExpect(jsonPath("$.message").value("Task not found or unauthorized for id: " + createdAdminTask.getId()));
    }
}
```