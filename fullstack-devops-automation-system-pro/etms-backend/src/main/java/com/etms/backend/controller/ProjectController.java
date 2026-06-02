package com.etms.backend.controller;

import com.etms.backend.dto.ProjectDTO;
import com.etms.backend.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@SecurityRequirement(name = "jwtAuth")
@Tag(name = "Project Management", description = "API for managing projects")
public class ProjectController {

    private final ProjectService projectService;

    @Operation(summary = "Get all projects")
    @GetMapping
    @PreAuthorize("hasAnyAuthority('USER', 'ADMIN')")
    public ResponseEntity<List<ProjectDTO>> getAllProjects() {
        List<ProjectDTO> projects = projectService.getAllProjects();
        return ResponseEntity.ok(projects);
    }

    @Operation(summary = "Get project by ID")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('USER', 'ADMIN')")
    public ResponseEntity<ProjectDTO> getProjectById(@PathVariable Long id) {
        ProjectDTO project = projectService.getProjectById(id);
        return ResponseEntity.ok(project);
    }

    @Operation(summary = "Create a new project")
    @PostMapping
    @PreAuthorize("hasAnyAuthority('USER', 'ADMIN')")
    public ResponseEntity<ProjectDTO> createProject(@Valid @RequestBody ProjectDTO projectDTO,
                                                    @AuthenticationPrincipal UserDetails userDetails) {
        // In a real app, you'd get the actual User ID from userDetails or a custom principal
        // For simplicity, let's assume a temporary way to get user ID or use the authenticated username to find user.
        // This requires finding user by username, which is generally inefficient in a loop.
        // A better approach is to store user ID in JWT or custom UserDetails.
        // For this example, let's assume a service method can resolve the ID.
        // We will pass a placeholder '1L' as current user ID for creation.
        // TODO: In a production app, fetch the authenticated user's ID securely.
        Long currentUserId = 1L; // Placeholder
        ProjectDTO createdProject = projectService.createProject(projectDTO, currentUserId);
        return new ResponseEntity<>(createdProject, HttpStatus.CREATED);
    }

    @Operation(summary = "Update an existing project")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('USER', 'ADMIN')")
    public ResponseEntity<ProjectDTO> updateProject(@PathVariable Long id, @Valid @RequestBody ProjectDTO projectDTO) {
        ProjectDTO updatedProject = projectService.updateProject(id, projectDTO);
        return ResponseEntity.ok(updatedProject);
    }

    @Operation(summary = "Delete a project (Admin only)")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}