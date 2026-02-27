package com.projectpulse.projectpulse.task.service;

import com.projectpulse.projectpulse.exception.ResourceNotFoundException;
import com.projectpulse.projectpulse.project.entity.Project;
import com.projectpulse.projectpulse.project.repository.ProjectRepository;
import com.projectpulse.projectpulse.task.dto.TaskCreateDto;
import com.projectpulse.projectpulse.task.dto.TaskDto;
import com.projectpulse.projectpulse.task.dto.TaskUpdateDto;
import com.projectpulse.projectpulse.task.entity.Task;
import com.projectpulse.projectpulse.task.repository.TaskRepository;
import com.projectpulse.projectpulse.user.entity.User;
import com.projectpulse.projectpulse.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private SecurityContext securityContext;
    @Mock
    private Authentication authentication;

    @InjectMocks
    private TaskService taskService;

    private User adminUser;
    private User projectCreator;
    private User assignedUser;
    private User otherUser;
    private Project testProject;
    private Task testTask;

    @BeforeEach
    void setUp() {
        adminUser = new User();
        adminUser.setId(1L);
        adminUser.setUsername("adminUser");
        adminUser.setRole(User.Role.ADMIN);

        projectCreator = new User();
        projectCreator.setId(2L);
        projectCreator.setUsername("creatorUser");
        projectCreator.setRole(User.Role.USER);

        assignedUser = new User();
        assignedUser.setId(3L);
        assignedUser.setUsername("assignedUser");
        assignedUser.setRole(User.Role.USER);

        otherUser = new User();
        otherUser.setId(4L);
        otherUser.setUsername("otherUser");
        otherUser.setRole(User.Role.USER);


        testProject = new Project();
        testProject.setId(10L);
        testProject.setName("Test Project");
        testProject.setCreatedBy(projectCreator);

        testTask = new Task();
        testTask.setId(100L);
        testTask.setTitle("Test Task");
        testTask.setProject(testProject);
        testTask.setAssignedTo(assignedUser);
        testTask.setStatus(Task.Status.PENDING);

        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(authentication);
    }

    @Test
    void createTask_AsProjectCreator_Success() {
        when(authentication.getName()).thenReturn(projectCreator.getUsername());
        when(userRepository.findByUsername(projectCreator.getUsername())).thenReturn(Optional.of(projectCreator));
        when(projectRepository.findById(testProject.getId())).thenReturn(Optional.of(testProject));
        when(userRepository.findById(assignedUser.getId())).thenReturn(Optional.of(assignedUser));
        when(taskRepository.save(any(Task.class))).thenReturn(testTask);

        TaskCreateDto createDto = new TaskCreateDto();
        createDto.setTitle("New Task");
        createDto.setProjectId(testProject.getId());
        createDto.setAssignedToUserId(assignedUser.getId());

        TaskDto result = taskService.createTask(createDto);

        assertNotNull(result);
        assertEquals("Test Task", result.getTitle());
        verify(taskRepository, times(1)).save(any(Task.class));
    }

    @Test
    void createTask_AsAdmin_Success() {
        when(authentication.getName()).thenReturn(adminUser.getUsername());
        when(userRepository.findByUsername(adminUser.getUsername())).thenReturn(Optional.of(adminUser));
        when(projectRepository.findById(testProject.getId())).thenReturn(Optional.of(testProject));
        when(userRepository.findById(assignedUser.getId())).thenReturn(Optional.of(assignedUser));
        when(taskRepository.save(any(Task.class))).thenReturn(testTask);

        TaskCreateDto createDto = new TaskCreateDto();
        createDto.setTitle("Admin Created Task");
        createDto.setProjectId(testProject.getId());
        createDto.setAssignedToUserId(assignedUser.getId());

        TaskDto result = taskService.createTask(createDto);

        assertNotNull(result);
        assertEquals("Test Task", result.getTitle());
        verify(taskRepository, times(1)).save(any(Task.class));
    }

    @Test
    void createTask_NotAuthorized_ThrowsAccessDeniedException() {
        when(authentication.getName()).thenReturn(otherUser.getUsername());
        when(userRepository.findByUsername(otherUser.getUsername())).thenReturn(Optional.of(otherUser));
        when(projectRepository.findById(testProject.getId())).thenReturn(Optional.of(testProject));

        TaskCreateDto createDto = new TaskCreateDto();
        createDto.setTitle("Unauthorized Task");
        createDto.setProjectId(testProject.getId());

        assertThrows(AccessDeniedException.class, () -> taskService.createTask(createDto));
        verify(taskRepository, never()).save(any(Task.class));
    }

    @Test
    void getTaskById_Found_ReturnsDto() {
        when(taskRepository.findById(testTask.getId())).thenReturn(Optional.of(testTask));

        TaskDto result = taskService.getTaskById(testTask.getId());

        assertNotNull(result);
        assertEquals(testTask.getTitle(), result.getTitle());
    }

    @Test
    void getTaskById_NotFound_ThrowsException() {
        when(taskRepository.findById(anyLong())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> taskService.getTaskById(99L));
    }

    @Test
    void getTasksByProjectId_ReturnsList() {
        when(projectRepository.existsById(testProject.getId())).thenReturn(true);
        when(taskRepository.findByProjectId(testProject.getId())).thenReturn(List.of(testTask));

        List<TaskDto> result = taskService.getTasksByProjectId(testProject.getId());

        assertNotNull(result);
        assertFalse(result.isEmpty());
        assertEquals(1, result.size());
        assertEquals(testTask.getTitle(), result.get(0).getTitle());
    }

    @Test
    void getTasksAssignedToCurrentUser_ReturnsList() {
        when(authentication.getName()).thenReturn(assignedUser.getUsername());
        when(userRepository.findByUsername(assignedUser.getUsername())).thenReturn(Optional.of(assignedUser));
        when(taskRepository.findByAssignedTo_Id(assignedUser.getId())).thenReturn(List.of(testTask));

        List<TaskDto> result = taskService.getTasksAssignedToCurrentUser();

        assertNotNull(result);
        assertFalse(result.isEmpty());
        assertEquals(1, result.size());
        assertEquals(testTask.getTitle(), result.get(0).getTitle());
    }

    @Test
    void updateTask_AsAssignedUser_Success() {
        when(authentication.getName()).thenReturn(assignedUser.getUsername());
        when(userRepository.findByUsername(assignedUser.getUsername())).thenReturn(Optional.of(assignedUser));
        when(taskRepository.findById(testTask.getId())).thenReturn(Optional.of(testTask));
        when(taskRepository.save(any(Task.class))).thenReturn(testTask);

        TaskUpdateDto updateDto = new TaskUpdateDto();
        updateDto.setStatus(Task.Status.IN_PROGRESS);

        TaskDto result = taskService.updateTask(testTask.getId(), updateDto);

        assertNotNull(result);
        assertEquals(Task.Status.IN_PROGRESS, result.getStatus());
        verify(taskRepository, times(1)).save(any(Task.class));
    }

    @Test
    void updateTask_AsProjectCreator_Success() {
        when(authentication.getName()).thenReturn(projectCreator.getUsername());
        when(userRepository.findByUsername(projectCreator.getUsername())).thenReturn(Optional.of(projectCreator));
        when(taskRepository.findById(testTask.getId())).thenReturn(Optional.of(testTask));
        when(taskRepository.save(any(Task.class))).thenReturn(testTask);

        TaskUpdateDto updateDto = new TaskUpdateDto();
        updateDto.setDescription("Updated by creator");

        TaskDto result = taskService.updateTask(testTask.getId(), updateDto);

        assertNotNull(result);
        assertEquals("Updated by creator", result.getDescription());
        verify(taskRepository, times(1)).save(any(Task.class));
    }

    @Test
    void updateTask_AsAdmin_Success() {
        when(authentication.getName()).thenReturn(adminUser.getUsername());
        when(userRepository.findByUsername(adminUser.getUsername())).thenReturn(Optional.of(adminUser));
        when(taskRepository.findById(testTask.getId())).thenReturn(Optional.of(testTask));
        when(taskRepository.save(any(Task.class))).thenReturn(testTask);

        TaskUpdateDto updateDto = new TaskUpdateDto();
        updateDto.setTitle("Admin Update");

        TaskDto result = taskService.updateTask(testTask.getId(), updateDto);

        assertNotNull(result);
        assertEquals("Admin Update", result.getTitle());
        verify(taskRepository, times(1)).save(any(Task.class));
    }

    @Test
    void updateTask_NotAuthorized_ThrowsAccessDeniedException() {
        when(authentication.getName()).thenReturn(otherUser.getUsername());
        when(userRepository.findByUsername(otherUser.getUsername())).thenReturn(Optional.of(otherUser));
        when(taskRepository.findById(testTask.getId())).thenReturn(Optional.of(testTask));

        TaskUpdateDto updateDto = new TaskUpdateDto();
        updateDto.setStatus(Task.Status.COMPLETED);

        assertThrows(AccessDeniedException.class, () -> taskService.updateTask(testTask.getId(), updateDto));
        verify(taskRepository, never()).save(any(Task.class));
    }

    @Test
    void deleteTask_AsProjectCreator_Success() {
        when(authentication.getName()).thenReturn(projectCreator.getUsername());
        when(userRepository.findByUsername(projectCreator.getUsername())).thenReturn(Optional.of(projectCreator));
        when(taskRepository.findById(testTask.getId())).thenReturn(Optional.of(testTask));
        doNothing().when(taskRepository).delete(any(Task.class));

        taskService.deleteTask(testTask.getId());

        verify(taskRepository, times(1)).delete(testTask);
    }

    @Test
    void deleteTask_AsAdmin_Success() {
        when(authentication.getName()).thenReturn(adminUser.getUsername());
        when(userRepository.findByUsername(adminUser.getUsername())).thenReturn(Optional.of(adminUser));
        when(taskRepository.findById(testTask.getId())).thenReturn(Optional.of(testTask));
        doNothing().when(taskRepository).delete(any(Task.class));

        taskService.deleteTask(testTask.getId());

        verify(taskRepository, times(1)).delete(testTask);
    }

    @Test
    void deleteTask_NotAuthorized_ThrowsAccessDeniedException() {
        when(authentication.getName()).thenReturn(assignedUser.getUsername()); // Assigned user cannot delete
        when(userRepository.findByUsername(assignedUser.getUsername())).thenReturn(Optional.of(assignedUser));
        when(taskRepository.findById(testTask.getId())).thenReturn(Optional.of(testTask));

        assertThrows(AccessDeniedException.class, () -> taskService.deleteTask(testTask.getId()));
        verify(taskRepository, never()).delete(any(Task.class));
    }
}
```
**`backend/src/test/java/com/projectpulse/projectpulse/user/service/UserServiceTest.java`**
```java