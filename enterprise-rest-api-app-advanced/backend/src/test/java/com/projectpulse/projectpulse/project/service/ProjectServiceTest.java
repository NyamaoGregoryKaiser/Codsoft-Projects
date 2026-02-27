package com.projectpulse.projectpulse.project.service;

import com.projectpulse.projectpulse.exception.ResourceNotFoundException;
import com.projectpulse.projectpulse.project.dto.ProjectCreateDto;
import com.projectpulse.projectpulse.project.dto.ProjectDto;
import com.projectpulse.projectpulse.project.dto.ProjectUpdateDto;
import com.projectpulse.projectpulse.project.entity.Project;
import com.projectpulse.projectpulse.project.repository.ProjectRepository;
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

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private SecurityContext securityContext;
    @Mock
    private Authentication authentication;

    @InjectMocks
    private ProjectService projectService;

    private User adminUser;
    private User regularUser;
    private Project testProject;

    @BeforeEach
    void setUp() {
        adminUser = new User();
        adminUser.setId(1L);
        adminUser.setUsername("adminUser");
        adminUser.setRole(User.Role.ADMIN);

        regularUser = new User();
        regularUser.setId(2L);
        regularUser.setUsername("regularUser");
        regularUser.setRole(User.Role.USER);

        testProject = new Project();
        testProject.setId(10L);
        testProject.setName("Test Project");
        testProject.setDescription("Description");
        testProject.setCreatedBy(regularUser);
        testProject.setCreatedAt(LocalDateTime.now());
        testProject.setUpdatedAt(LocalDateTime.now());

        // Setup security context for authenticated user simulation
        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(authentication);
    }

    @Test
    void createProject_Success() {
        when(authentication.getName()).thenReturn(regularUser.getUsername());
        when(userRepository.findByUsername(regularUser.getUsername())).thenReturn(Optional.of(regularUser));
        when(projectRepository.existsByName(anyString())).thenReturn(false);
        when(projectRepository.save(any(Project.class))).thenReturn(testProject);

        ProjectCreateDto createDto = new ProjectCreateDto();
        createDto.setName("New Project");
        createDto.setDescription("New Description");

        ProjectDto result = projectService.createProject(createDto);

        assertNotNull(result);
        assertEquals("Test Project", result.getName());
        verify(projectRepository, times(1)).save(any(Project.class));
    }

    @Test
    void createProject_NameAlreadyExists_ThrowsException() {
        when(authentication.getName()).thenReturn(regularUser.getUsername());
        when(userRepository.findByUsername(regularUser.getUsername())).thenReturn(Optional.of(regularUser));
        when(projectRepository.existsByName(anyString())).thenReturn(true);

        ProjectCreateDto createDto = new ProjectCreateDto();
        createDto.setName("Existing Project");

        assertThrows(IllegalArgumentException.class, () -> projectService.createProject(createDto));
        verify(projectRepository, never()).save(any(Project.class));
    }

    @Test
    void getProjectById_Found_ReturnsDto() {
        when(projectRepository.findById(testProject.getId())).thenReturn(Optional.of(testProject));

        ProjectDto result = projectService.getProjectById(testProject.getId());

        assertNotNull(result);
        assertEquals(testProject.getName(), result.getName());
    }

    @Test
    void getProjectById_NotFound_ThrowsException() {
        when(projectRepository.findById(anyLong())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> projectService.getProjectById(99L));
    }

    @Test
    void getAllProjects_ReturnsList() {
        when(projectRepository.findAll()).thenReturn(List.of(testProject));

        List<ProjectDto> result = projectService.getAllProjects();

        assertNotNull(result);
        assertFalse(result.isEmpty());
        assertEquals(1, result.size());
        assertEquals(testProject.getName(), result.get(0).getName());
    }

    @Test
    void getProjectsByCurrentUser_ReturnsList() {
        when(authentication.getName()).thenReturn(regularUser.getUsername());
        when(userRepository.findByUsername(regularUser.getUsername())).thenReturn(Optional.of(regularUser));
        when(projectRepository.findByCreatedBy_Id(regularUser.getId())).thenReturn(List.of(testProject));

        List<ProjectDto> result = projectService.getProjectsByCurrentUser();

        assertNotNull(result);
        assertFalse(result.isEmpty());
        assertEquals(1, result.size());
        assertEquals(testProject.getName(), result.get(0).getName());
    }

    @Test
    void updateProject_AsCreator_Success() {
        when(authentication.getName()).thenReturn(regularUser.getUsername());
        when(userRepository.findByUsername(regularUser.getUsername())).thenReturn(Optional.of(regularUser));
        when(projectRepository.findById(testProject.getId())).thenReturn(Optional.of(testProject));
        when(projectRepository.existsByName(anyString())).thenReturn(false); // No existing project with new name
        when(projectRepository.save(any(Project.class))).thenReturn(testProject);

        ProjectUpdateDto updateDto = new ProjectUpdateDto();
        updateDto.setName("Updated Project Name");

        ProjectDto result = projectService.updateProject(testProject.getId(), updateDto);

        assertNotNull(result);
        assertEquals("Updated Project Name", result.getName());
        verify(projectRepository, times(1)).save(any(Project.class));
    }

    @Test
    void updateProject_AsAdmin_Success() {
        when(authentication.getName()).thenReturn(adminUser.getUsername());
        when(userRepository.findByUsername(adminUser.getUsername())).thenReturn(Optional.of(adminUser));
        when(projectRepository.findById(testProject.getId())).thenReturn(Optional.of(testProject));
        when(projectRepository.existsByName(anyString())).thenReturn(false);
        when(projectRepository.save(any(Project.class))).thenReturn(testProject);

        ProjectUpdateDto updateDto = new ProjectUpdateDto();
        updateDto.setName("Admin Updated Project Name");

        ProjectDto result = projectService.updateProject(testProject.getId(), updateDto);

        assertNotNull(result);
        assertEquals("Admin Updated Project Name", result.getName());
        verify(projectRepository, times(1)).save(any(Project.class));
    }

    @Test
    void updateProject_NotAuthorized_ThrowsAccessDeniedException() {
        User otherUser = new User();
        otherUser.setId(3L);
        otherUser.setRole(User.Role.USER);
        otherUser.setUsername("otherUser");

        when(authentication.getName()).thenReturn(otherUser.getUsername());
        when(userRepository.findByUsername(otherUser.getUsername())).thenReturn(Optional.of(otherUser));
        when(projectRepository.findById(testProject.getId())).thenReturn(Optional.of(testProject));

        ProjectUpdateDto updateDto = new ProjectUpdateDto();
        updateDto.setName("Unauthorized Update");

        assertThrows(AccessDeniedException.class, () -> projectService.updateProject(testProject.getId(), updateDto));
        verify(projectRepository, never()).save(any(Project.class));
    }

    @Test
    void deleteProject_AsCreator_Success() {
        when(authentication.getName()).thenReturn(regularUser.getUsername());
        when(userRepository.findByUsername(regularUser.getUsername())).thenReturn(Optional.of(regularUser));
        when(projectRepository.findById(testProject.getId())).thenReturn(Optional.of(testProject));
        doNothing().when(projectRepository).delete(any(Project.class));

        projectService.deleteProject(testProject.getId());

        verify(projectRepository, times(1)).delete(testProject);
    }

    @Test
    void deleteProject_AsAdmin_Success() {
        when(authentication.getName()).thenReturn(adminUser.getUsername());
        when(userRepository.findByUsername(adminUser.getUsername())).thenReturn(Optional.of(adminUser));
        when(projectRepository.findById(testProject.getId())).thenReturn(Optional.of(testProject));
        doNothing().when(projectRepository).delete(any(Project.class));

        projectService.deleteProject(testProject.getId());

        verify(projectRepository, times(1)).delete(testProject);
    }

    @Test
    void deleteProject_NotAuthorized_ThrowsAccessDeniedException() {
        User otherUser = new User();
        otherUser.setId(3L);
        otherUser.setRole(User.Role.USER);
        otherUser.setUsername("otherUser");

        when(authentication.getName()).thenReturn(otherUser.getUsername());
        when(userRepository.findByUsername(otherUser.getUsername())).thenReturn(Optional.of(otherUser));
        when(projectRepository.findById(testProject.getId())).thenReturn(Optional.of(testProject));

        assertThrows(AccessDeniedException.class, () -> projectService.deleteProject(testProject.getId()));
        verify(projectRepository, never()).delete(any(Project.class));
    }
}
```
**`backend/src/test/java/com/projectpulse/projectpulse/task/service/TaskServiceTest.java`**
```java