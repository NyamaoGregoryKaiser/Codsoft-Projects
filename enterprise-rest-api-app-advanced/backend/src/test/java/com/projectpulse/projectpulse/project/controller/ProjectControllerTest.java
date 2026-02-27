package com.projectpulse.projectpulse.project.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.projectpulse.projectpulse.project.dto.ProjectCreateDto;
import com.projectpulse.projectpulse.project.dto.ProjectDto;
import com.projectpulse.projectpulse.project.dto.ProjectUpdateDto;
import com.projectpulse.projectpulse.project.service.ProjectService;
import com.projectpulse.projectpulse.user.dto.UserDto;
import com.projectpulse.projectpulse.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProjectController.class)
class ProjectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProjectService projectService;

    private ProjectDto testProjectDto;
    private ProjectCreateDto createDto;
    private ProjectUpdateDto updateDto;
    private UserDto creatorUserDto;

    @BeforeEach
    void setUp() {
        creatorUserDto = new UserDto();
        creatorUserDto.setId(1L);
        creatorUserDto.setUsername("creator");
        creatorUserDto.setEmail("creator@example.com");
        creatorUserDto.setRole(User.Role.USER);

        testProjectDto = new ProjectDto();
        testProjectDto.setId(1L);
        testProjectDto.setName("Test Project");
        testProjectDto.setDescription("This is a test project.");
        testProjectDto.setCreatedBy(creatorUserDto);
        testProjectDto.setCreatedAt(LocalDateTime.now());
        testProjectDto.setUpdatedAt(LocalDateTime.now());
        testProjectDto.setTasks(List.of());

        createDto = new ProjectCreateDto();
        createDto.setName("New Project");
        createDto.setDescription("New project description.");

        updateDto = new ProjectUpdateDto();
        updateDto.setName("Updated Project");
        updateDto.setDescription("Updated description.");
    }

    @Test
    @WithMockUser(username = "creator", roles = "USER")
    void createProject_Success() throws Exception {
        when(projectService.createProject(any(ProjectCreateDto.class))).thenReturn(testProjectDto);

        mockMvc.perform(post("/api/v1/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(testProjectDto.getId()))
                .andExpect(jsonPath("$.name").value(testProjectDto.getName()));

        verify(projectService, times(1)).createProject(any(ProjectCreateDto.class));
    }

    @Test
    @WithMockUser(username = "user", roles = "USER")
    void getProjectById_Success() throws Exception {
        when(projectService.getProjectById(anyLong())).thenReturn(testProjectDto);

        mockMvc.perform(get("/api/v1/projects/{id}", 1L)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(testProjectDto.getId()))
                .andExpect(jsonPath("$.name").value(testProjectDto.getName()));

        verify(projectService, times(1)).getProjectById(anyLong());
    }

    @Test
    @WithMockUser(username = "user", roles = "USER")
    void getAllProjects_Success() throws Exception {
        List<ProjectDto> projects = Arrays.asList(testProjectDto, new ProjectDto());
        when(projectService.getAllProjects()).thenReturn(projects);

        mockMvc.perform(get("/api/v1/projects")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(projects.size()))
                .andExpect(jsonPath("$[0].name").value(testProjectDto.getName()));

        verify(projectService, times(1)).getAllProjects();
    }

    @Test
    @WithMockUser(username = "creator", roles = "USER")
    void updateProject_Success() throws Exception {
        ProjectDto updatedProject = new ProjectDto();
        updatedProject.setId(1L);
        updatedProject.setName(updateDto.getName());
        updatedProject.setDescription(updateDto.getDescription());
        updatedProject.setCreatedBy(creatorUserDto);

        when(projectService.updateProject(anyLong(), any(ProjectUpdateDto.class))).thenReturn(updatedProject);

        mockMvc.perform(put("/api/v1/projects/{id}", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(updatedProject.getId()))
                .andExpect(jsonPath("$.name").value(updatedProject.getName()));

        verify(projectService, times(1)).updateProject(anyLong(), any(ProjectUpdateDto.class));
    }

    @Test
    @WithMockUser(username = "creator", roles = "USER")
    void deleteProject_Success() throws Exception {
        doNothing().when(projectService).deleteProject(anyLong());

        mockMvc.perform(delete("/api/v1/projects/{id}", 1L)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());

        verify(projectService, times(1)).deleteProject(anyLong());
    }

    @Test
    void createProject_Unauthorized() throws Exception {
        // No @WithMockUser, so it's unauthenticated
        mockMvc.perform(post("/api/v1/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isUnauthorized());
    }
}
```
**`backend/src/test/java/com/projectpulse/projectpulse/integration/ProjectPulseIntegrationTest.java`**
```java