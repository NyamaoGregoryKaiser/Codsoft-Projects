package com.etms.backend.service;

import com.etms.backend.dto.TaskDTO;
import com.etms.backend.exception.ResourceNotFoundException;
import com.etms.backend.model.*;
import com.etms.backend.repository.ProjectRepository;
import com.etms.backend.repository.TaskRepository;
import com.etms.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TaskService Unit Tests")
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TaskService taskService;

    private User testUser;
    private Project testProject;
    private Task testTask;
    private TaskDTO testTaskDTO;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .username("user1")
                .email("user1@example.com")
                .password("pass")
                .role(Role.USER)
                .build();

        testProject = Project.builder()
                .id(10L)
                .name("Test Project")
                .description("Desc")
                .createdBy(testUser)
                .build();

        testTask = Task.builder()
                .id(100L)
                .title("Test Task")
                .description("Task Desc")
                .status(TaskStatus.OPEN)
                .priority(TaskPriority.MEDIUM)
                .project(testProject)
                .assignedTo(testUser)
                .dueDate(LocalDateTime.now().plusDays(7))
                .build();

        testTaskDTO = TaskDTO.builder()
                .id(100L)
                .title("Test Task")
                .description("Task Desc")
                .status(TaskStatus.OPEN)
                .priority(TaskPriority.MEDIUM)
                .projectId(10L)
                .assignedToId(1L)
                .assignedToUsername("user1")
                .dueDate(LocalDateTime.now().plusDays(7))
                .build();
    }

    @Test
    @DisplayName("Should return all tasks")
    void shouldGetAllTasks() {
        when(taskRepository.findAll()).thenReturn(Arrays.asList(testTask));

        List<TaskDTO> tasks = taskService.getAllTasks();

        assertThat(tasks).isNotEmpty().hasSize(1);
        assertThat(tasks.get(0).getTitle()).isEqualTo(testTaskDTO.getTitle());
        verify(taskRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should return task by ID")
    void shouldGetTaskById() {
        when(taskRepository.findById(testTask.getId())).thenReturn(Optional.of(testTask));

        TaskDTO foundTask = taskService.getTaskById(testTask.getId());

        assertThat(foundTask).isNotNull();
        assertThat(foundTask.getTitle()).isEqualTo(testTaskDTO.getTitle());
        verify(taskRepository, times(1)).findById(testTask.getId());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when getting non-existent task by ID")
    void shouldThrowExceptionForNonExistentTaskId() {
        when(taskRepository.findById(anyLong())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> taskService.getTaskById(999L));
        verify(taskRepository, times(1)).findById(999L);
    }

    @Test
    @DisplayName("Should create a new task")
    void shouldCreateTask() {
        when(projectRepository.findById(testProject.getId())).thenReturn(Optional.of(testProject));
        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(taskRepository.save(any(Task.class))).thenReturn(testTask);

        TaskDTO createdTask = taskService.createTask(testTaskDTO);

        assertThat(createdTask).isNotNull();
        assertThat(createdTask.getId()).isEqualTo(testTask.getId());
        assertThat(createdTask.getTitle()).isEqualTo(testTaskDTO.getTitle());
        verify(projectRepository, times(1)).findById(testProject.getId());
        verify(userRepository, times(1)).findById(testUser.getId());
        verify(taskRepository, times(1)).save(any(Task.class));
    }

    @Test
    @DisplayName("Should update an existing task")
    void shouldUpdateTask() {
        TaskDTO updatedTaskDTO = TaskDTO.builder()
                .id(100L)
                .title("Updated Task Title")
                .description("Updated Desc")
                .status(TaskStatus.DONE)
                .priority(TaskPriority.HIGH)
                .projectId(10L)
                .assignedToId(1L)
                .dueDate(LocalDateTime.now().plusDays(10))
                .build();

        when(taskRepository.findById(testTask.getId())).thenReturn(Optional.of(testTask));
        when(projectRepository.findById(testProject.getId())).thenReturn(Optional.of(testProject));
        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(taskRepository.save(any(Task.class))).thenReturn(testTask); // The saved task will have updated fields

        TaskDTO result = taskService.updateTask(testTask.getId(), updatedTaskDTO);

        assertThat(result).isNotNull();
        assertThat(result.getTitle()).isEqualTo(updatedTaskDTO.getTitle());
        assertThat(result.getDescription()).isEqualTo(updatedTaskDTO.getDescription());
        assertThat(result.getStatus()).isEqualTo(updatedTaskDTO.getStatus());
        verify(taskRepository, times(1)).findById(testTask.getId());
        verify(projectRepository, times(1)).findById(testProject.getId());
        verify(userRepository, times(1)).findById(testUser.getId());
        verify(taskRepository, times(1)).save(any(Task.class));
    }

    @Test
    @DisplayName("Should delete a task")
    void shouldDeleteTask() {
        when(taskRepository.existsById(testTask.getId())).thenReturn(true);
        doNothing().when(taskRepository).deleteById(testTask.getId());

        taskService.deleteTask(testTask.getId());

        verify(taskRepository, times(1)).existsById(testTask.getId());
        verify(taskRepository, times(1)).deleteById(testTask.getId());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when deleting non-existent task")
    void shouldThrowExceptionForNonExistentTaskDelete() {
        when(taskRepository.existsById(anyLong())).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> taskService.deleteTask(999L));
        verify(taskRepository, times(1)).existsById(999L);
        verify(taskRepository, never()).deleteById(anyLong());
    }
}