```java
package com.tasks.taskmanagement.service;

import com.tasks.taskmanagement.dto.TaskDTO;
import com.tasks.taskmanagement.dto.UserDTO;
import com.tasks.taskmanagement.entity.Project;
import com.tasks.taskmanagement.entity.Task;
import com.tasks.taskmanagement.entity.User;
import com.tasks.taskmanagement.exception.ResourceNotFoundException;
import com.tasks.taskmanagement.exception.UnauthorizedException;
import com.tasks.taskmanagement.repository.TaskRepository;
import com.tasks.taskmanagement.util.MapperUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;
    @Mock
    private UserService userService;
    @Mock
    private ProjectService projectService;
    @Mock
    private TagService tagService;
    @Mock
    private AuthService authService;
    @Mock
    private MapperUtil mapperUtil;

    @InjectMocks
    private TaskService taskService;

    private User testUser;
    private Project testProject;
    private Task testTask;
    private TaskDTO testTaskDTO;
    private UUID taskId;
    private UUID userId;
    private UUID projectId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        projectId = UUID.randomUUID();
        taskId = UUID.randomUUID();

        testUser = User.builder()
                .id(userId)
                .username("testuser")
                .email("test@example.com")
                .role(User.Role.USER)
                .build();

        testProject = Project.builder()
                .id(projectId)
                .name("Test Project")
                .owner(testUser)
                .build();

        testTask = Task.builder()
                .id(taskId)
                .title("Test Task")
                .description("A sample description")
                .status(Task.Status.PENDING)
                .priority(Task.Priority.MEDIUM)
                .dueDate(LocalDateTime.now().plusDays(7))
                .assignee(testUser)
                .project(testProject)
                .tags(Collections.emptySet())
                .build();

        testTaskDTO = TaskDTO.builder()
                .id(taskId)
                .title("Test Task")
                .description("A sample description")
                .status(Task.Status.PENDING)
                .priority(Task.Priority.MEDIUM)
                .dueDate(LocalDateTime.now().plusDays(7))
                .assigneeId(userId)
                .projectId(projectId)
                .tags(Collections.emptySet())
                .build();

        // Common mock for authService to return the testUser
        when(authService.getCurrentAuthenticatedUser()).thenReturn(testUser);
        // Common mock for MapperUtil
        when(mapperUtil.map(any(Task.class), eq(TaskDTO.class))).thenReturn(testTaskDTO);
        when(mapperUtil.map(any(TaskDTO.class), eq(Task.class))).thenReturn(testTask);
        when(mapperUtil.map(any(User.class), eq(UserDTO.class))).thenReturn(UserDTO.builder().id(userId).username("testuser").build());
    }

    @Test
    @DisplayName("Should create a task successfully")
    void createTask_Success() {
        when(userService.getUserEntityById(userId)).thenReturn(testUser);
        when(projectService.getProjectEntityById(projectId)).thenReturn(testProject);
        when(taskRepository.save(any(Task.class))).thenReturn(testTask);

        TaskDTO createdTask = taskService.createTask(testTaskDTO);

        assertThat(createdTask).isNotNull();
        assertThat(createdTask.getTitle()).isEqualTo("Test Task");
        verify(taskRepository, times(1)).save(any(Task.class));
    }

    @Test
    @DisplayName("Should throw UnauthorizedException when creating task for a project not owned by current user")
    void createTask_UnauthorizedProject() {
        User otherUser = User.builder().id(UUID.randomUUID()).username("other").build();
        Project otherProject = Project.builder().id(UUID.randomUUID()).owner(otherUser).build();
        testTaskDTO.setProjectId(otherProject.getId());

        when(projectService.getProjectEntityById(otherProject.getId())).thenReturn(otherProject);

        assertThrows(UnauthorizedException.class, () -> taskService.createTask(testTaskDTO));
        verify(taskRepository, never()).save(any(Task.class));
    }

    @Test
    @DisplayName("Should retrieve a task by ID successfully")
    void getTaskById_Success() {
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));

        TaskDTO foundTask = taskService.getTaskById(taskId);

        assertThat(foundTask).isNotNull();
        assertThat(foundTask.getId()).isEqualTo(taskId);
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when task not found by ID")
    void getTaskById_NotFound() {
        when(taskRepository.findById(taskId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> taskService.getTaskById(taskId));
    }

    @Test
    @DisplayName("Should throw UnauthorizedException when task is not assigned to user and not project owner")
    void getTaskById_Unauthorized() {
        User otherUser = User.builder().id(UUID.randomUUID()).username("other").role(User.Role.USER).build();
        when(authService.getCurrentAuthenticatedUser()).thenReturn(otherUser);

        Project projectOwnedByOther = Project.builder().id(UUID.randomUUID()).owner(otherUser).build();
        Task taskForOther = Task.builder()
                .id(UUID.randomUUID())
                .title("Other Task")
                .assignee(otherUser)
                .project(projectOwnedByOther)
                .build();

        when(taskRepository.findById(taskForOther.getId())).thenReturn(Optional.of(taskForOther));

        assertThrows(UnauthorizedException.class, () -> taskService.getTaskById(taskForOther.getId()));
    }

    @Test
    @DisplayName("Should update an existing task successfully")
    void updateTask_Success() {
        TaskDTO updatedDTO = TaskDTO.builder()
                .title("Updated Task Title")
                .description("Updated Description")
                .status(Task.Status.IN_PROGRESS)
                .priority(Task.Priority.HIGH)
                .dueDate(LocalDateTime.now().plusDays(10))
                .assigneeId(userId)
                .projectId(projectId)
                .tags(Collections.emptySet())
                .build();

        when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));
        when(userService.getUserEntityById(userId)).thenReturn(testUser);
        when(projectService.getProjectEntityById(projectId)).thenReturn(testProject);
        when(taskRepository.save(any(Task.class))).thenReturn(testTask); // Return original for simplicity in this mock

        TaskDTO result = taskService.updateTask(taskId, updatedDTO);

        assertThat(result).isNotNull();
        assertThat(result.getTitle()).isEqualTo(updatedDTO.getTitle());
        verify(taskRepository, times(1)).save(any(Task.class));
    }

    @Test
    @DisplayName("Should delete a task successfully")
    void deleteTask_Success() {
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));
        doNothing().when(taskRepository).deleteById(taskId);

        taskService.deleteTask(taskId);

        verify(taskRepository, times(1)).deleteById(taskId);
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when deleting non-existent task")
    void deleteTask_NotFound() {
        when(taskRepository.findById(taskId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> taskService.deleteTask(taskId));
        verify(taskRepository, never()).deleteById(any(UUID.class));
    }
}
```