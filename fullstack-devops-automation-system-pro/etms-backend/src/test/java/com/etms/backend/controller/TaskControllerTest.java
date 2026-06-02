package com.etms.backend.controller;

import com.etms.backend.dto.TaskDTO;
import com.etms.backend.model.TaskPriority;
import com.etms.backend.model.TaskStatus;
import com.etms.backend.service.TaskService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = TaskController.class)
@DisplayName("TaskController API Tests")
class TaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TaskService taskService;

    @Autowired
    private ObjectMapper objectMapper;

    private TaskDTO createTaskDTO(Long id, String title, TaskStatus status, TaskPriority priority, Long projectId, Long assignedToId) {
        return TaskDTO.builder()
                .id(id)
                .title(title)
                .description("Desc for " + title)
                .status(status)
                .priority(priority)
                .projectId(projectId)
                .assignedToId(assignedToId)
                .dueDate(LocalDateTime.now().plusDays(7))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    @WithMockUser(authorities = {"USER"})
    @DisplayName("GET /api/tasks - Should return all tasks for USER role")
    void getAllTasks_UserRole_ShouldReturnAllTasks() throws Exception {
        List<TaskDTO> tasks = Arrays.asList(
                createTaskDTO(10L, "Task 1", TaskStatus.OPEN, TaskPriority.MEDIUM, 1L, 1L),
                createTaskDTO(11L, "Task 2", TaskStatus.IN_PROGRESS, TaskPriority.HIGH, 1L, 2L)
        );
        when(taskService.getAllTasks()).thenReturn(tasks);

        mockMvc.perform(get("/api/tasks"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].title").value("Task 1"));

        verify(taskService, times(1)).getAllTasks();
    }

    @Test
    @WithMockUser(authorities = {"ADMIN"})
    @DisplayName("GET /api/tasks/{id} - Should return task by ID for ADMIN role")
    void getTaskById_AdminRole_ShouldReturnTask() throws Exception {
        TaskDTO task = createTaskDTO(10L, "Task 1", TaskStatus.OPEN, TaskPriority.MEDIUM, 1L, 1L);
        when(taskService.getTaskById(10L)).thenReturn(task);

        mockMvc.perform(get("/api/tasks/10"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.title").value("Task 1"));

        verify(taskService, times(1)).getTaskById(10L);
    }

    @Test
    @WithMockUser(authorities = {"USER"})
    @DisplayName("POST /api/tasks - Should create a new task for USER role")
    void createTask_UserRole_ShouldCreateTask() throws Exception {
        TaskDTO newTaskRequest = createTaskDTO(null, "New Task", TaskStatus.OPEN, TaskPriority.LOW, 1L, 1L);
        TaskDTO createdTask = createTaskDTO(12L, "New Task", TaskStatus.OPEN, TaskPriority.LOW, 1L, 1L);

        when(taskService.createTask(any(TaskDTO.class))).thenReturn(createdTask);

        mockMvc.perform(post("/api/tasks")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newTaskRequest)))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(12L))
                .andExpect(jsonPath("$.title").value("New Task"));

        verify(taskService, times(1)).createTask(any(TaskDTO.class));
    }

    @Test
    @WithMockUser(authorities = {"USER"})
    @DisplayName("PUT /api/tasks/{id} - Should update an existing task for USER role")
    void updateTask_UserRole_ShouldUpdateTask() throws Exception {
        TaskDTO updateRequest = createTaskDTO(10L, "Updated Task", TaskStatus.DONE, TaskPriority.HIGH, 1L, 1L);
        TaskDTO updatedTask = createTaskDTO(10L, "Updated Task", TaskStatus.DONE, TaskPriority.HIGH, 1L, 1L);

        when(taskService.updateTask(eq(10L), any(TaskDTO.class))).thenReturn(updatedTask);

        mockMvc.perform(put("/api/tasks/10")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.title").value("Updated Task"));

        verify(taskService, times(1)).updateTask(eq(10L), any(TaskDTO.class));
    }

    @Test
    @WithMockUser(authorities = {"ADMIN"})
    @DisplayName("DELETE /api/tasks/{id} - Should delete a task for ADMIN role")
    void deleteTask_AdminRole_ShouldDeleteTask() throws Exception {
        doNothing().when(taskService).deleteTask(10L);

        mockMvc.perform(delete("/api/tasks/10").with(csrf()))
                .andExpect(status().isNoContent());

        verify(taskService, times(1)).deleteTask(10L);
    }

    @Test
    @WithMockUser(authorities = {"USER"})
    @DisplayName("DELETE /api/tasks/{id} - Should return forbidden for USER role")
    void deleteTask_UserRole_ShouldReturnForbidden() throws Exception {
        mockMvc.perform(delete("/api/tasks/10").with(csrf()))
                .andExpect(status().isForbidden());

        verify(taskService, never()).deleteTask(anyLong());
    }
}