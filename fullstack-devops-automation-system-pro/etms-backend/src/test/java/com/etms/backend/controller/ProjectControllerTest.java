package com.etms.backend.controller;

import com.etms.backend.dto.ProjectDTO;
import com.etms.backend.model.Role;
import com.etms.backend.service.ProjectService;
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

@WebMvcTest(controllers = ProjectController.class)
@DisplayName("ProjectController API Tests")
class ProjectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProjectService projectService; // Mock the service layer

    @Autowired
    private ObjectMapper objectMapper;

    private ProjectDTO createProjectDTO(Long id, String name, String description, Long createdById, String createdByUsername) {
        return ProjectDTO.builder()
                .id(id)
                .name(name)
                .description(description)
                .createdById(createdById)
                .createdByUsername(createdByUsername)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    @WithMockUser(authorities = {"USER"})
    @DisplayName("GET /api/projects - Should return all projects for USER role")
    void getAllProjects_UserRole_ShouldReturnAllProjects() throws Exception {
        List<ProjectDTO> projects = Arrays.asList(
                createProjectDTO(1L, "Project Alpha", "Desc A", 1L, "user1"),
                createProjectDTO(2L, "Project Beta", "Desc B", 2L, "user2")
        );
        when(projectService.getAllProjects()).thenReturn(projects);

        mockMvc.perform(get("/api/projects"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].name").value("Project Alpha"));

        verify(projectService, times(1)).getAllProjects();
    }

    @Test
    @WithMockUser(authorities = {"ADMIN"})
    @DisplayName("GET /api/projects/{id} - Should return project by ID for ADMIN role")
    void getProjectById_AdminRole_ShouldReturnProject() throws Exception {
        ProjectDTO project = createProjectDTO(1L, "Project Alpha", "Desc A", 1L, "admin");
        when(projectService.getProjectById(1L)).thenReturn(project);

        mockMvc.perform(get("/api/projects/1"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.name").value("Project Alpha"));

        verify(projectService, times(1)).getProjectById(1L);
    }

    @Test
    @WithMockUser(authorities = {"USER"})
    @DisplayName("POST /api/projects - Should create a new project for USER role")
    void createProject_UserRole_ShouldCreateProject() throws Exception {
        ProjectDTO newProjectRequest = createProjectDTO(null, "New Project", "New Desc", null, null);
        ProjectDTO createdProject = createProjectDTO(3L, "New Project", "New Desc", 1L, "user1"); // Assuming user ID 1

        // Mock the service call, assuming createProject will internally resolve current user ID
        when(projectService.createProject(any(ProjectDTO.class), anyLong())).thenReturn(createdProject);

        mockMvc.perform(post("/api/projects")
                        .with(csrf()) // Required for POST requests with Spring Security
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newProjectRequest)))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(3L))
                .andExpect(jsonPath("$.name").value("New Project"));

        verify(projectService, times(1)).createProject(any(ProjectDTO.class), anyLong());
    }

    @Test
    @WithMockUser(authorities = {"USER"})
    @DisplayName("PUT /api/projects/{id} - Should update an existing project for USER role")
    void updateProject_UserRole_ShouldUpdateProject() throws Exception {
        ProjectDTO updateRequest = createProjectDTO(1L, "Updated Project", "Updated Desc", null, null);
        ProjectDTO updatedProject = createProjectDTO(1L, "Updated Project", "Updated Desc", 1L, "user1");

        when(projectService.updateProject(eq(1L), any(ProjectDTO.class))).thenReturn(updatedProject);

        mockMvc.perform(put("/api/projects/1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.name").value("Updated Project"));

        verify(projectService, times(1)).updateProject(eq(1L), any(ProjectDTO.class));
    }

    @Test
    @WithMockUser(authorities = {"ADMIN"})
    @DisplayName("DELETE /api/projects/{id} - Should delete a project for ADMIN role")
    void deleteProject_AdminRole_ShouldDeleteProject() throws Exception {
        doNothing().when(projectService).deleteProject(1L);

        mockMvc.perform(delete("/api/projects/1").with(csrf()))
                .andExpect(status().isNoContent());

        verify(projectService, times(1)).deleteProject(1L);
    }

    @Test
    @WithMockUser(authorities = {"USER"})
    @DisplayName("DELETE /api/projects/{id} - Should return forbidden for USER role")
    void deleteProject_UserRole_ShouldReturnForbidden() throws Exception {
        mockMvc.perform(delete("/api/projects/1").with(csrf()))
                .andExpect(status().isForbidden());

        verify(projectService, never()).deleteProject(anyLong());
    }
}