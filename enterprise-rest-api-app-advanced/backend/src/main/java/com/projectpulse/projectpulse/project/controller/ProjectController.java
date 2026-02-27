package com.projectpulse.projectpulse.project.controller;

import com.projectpulse.projectpulse.project.dto.ProjectCreateDto;
import com.projectpulse.projectpulse.project.dto.ProjectDto;
import com.projectpulse.projectpulse.project.dto.ProjectUpdateDto;
import com.projectpulse.projectpulse.project.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
@Tag(name = "Projects", description = "Project management APIs")
@SecurityRequirement(name = "bearerAuth") // Indicates that these endpoints require JWT authentication
public class ProjectController {

    private final ProjectService projectService;

    @Operation(summary = "Create a new project")
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ProjectDto> createProject(@Valid @RequestBody ProjectCreateDto createDto) {
        ProjectDto newProject = projectService.createProject(createDto);
        return new ResponseEntity<>(newProject, HttpStatus.CREATED);
    }

    @Operation(summary = "Get a project by ID")
    @GetMapping("/{id}")
    public ResponseEntity<ProjectDto> getProjectById(@PathVariable Long id) {
        ProjectDto project = projectService.getProjectById(id);
        return ResponseEntity.ok(project);
    }

    @Operation(summary = "Get all projects")
    @GetMapping
    public ResponseEntity<List<ProjectDto>> getAllProjects() {
        List<ProjectDto> projects = projectService.getAllProjects();
        return ResponseEntity.ok(projects);
    }

    @Operation(summary = "Get projects created by the current user")
    @GetMapping("/my-projects")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<ProjectDto>> getProjectsByCurrentUser() {
        List<ProjectDto> projects = projectService.getProjectsByCurrentUser();
        return ResponseEntity.ok(projects);
    }

    @Operation(summary = "Update an existing project by ID")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')") // Further authorization handled in service layer
    public ResponseEntity<ProjectDto> updateProject(@PathVariable Long id, @Valid @RequestBody ProjectUpdateDto updateDto) {
        ProjectDto updatedProject = projectService.updateProject(id, updateDto);
        return ResponseEntity.ok(updatedProject);
    }

    @Operation(summary = "Delete a project by ID")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')") // Further authorization handled in service layer
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }
}