```java
package com.tasks.taskmanagement.controller;

import com.tasks.taskmanagement.dto.ProjectDTO;
import com.tasks.taskmanagement.entity.User;
import com.tasks.taskmanagement.service.AuthService;
import com.tasks.taskmanagement.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@Slf4j
public class ProjectController {

    private final ProjectService projectService;
    private final AuthService authService;

    // Create a new project
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ProjectDTO> createProject(@Valid @RequestBody ProjectDTO projectDTO) {
        log.info("Received request to create project: {}", projectDTO.getName());
        ProjectDTO createdProject = projectService.createProject(projectDTO);
        return new ResponseEntity<>(createdProject, HttpStatus.CREATED);
    }

    // Get project by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @projectService.getProjectEntityById(#id).getOwner().getId().equals(@authService.getCurrentAuthenticatedUser().getId())")
    public ResponseEntity<ProjectDTO> getProjectById(@PathVariable UUID id) {
        log.info("Fetching project with ID: {}", id);
        ProjectDTO project = projectService.getProjectById(id);
        return ResponseEntity.ok(project);
    }

    // Get all projects (Admin only) or projects owned by current user
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ProjectDTO>> getAllProjects(@RequestParam(required = false) UUID ownerId) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        List<ProjectDTO> projects;

        if (ownerId != null) {
            // If ownerId is specified, ensure it's the current user or admin
            if (!ownerId.equals(currentUser.getId()) && currentUser.getRole() != User.Role.ADMIN) {
                log.warn("Unauthorized attempt to fetch projects for owner ID: {}", ownerId);
                return new ResponseEntity<>(HttpStatus.FORBIDDEN);
            }
            log.info("Fetching projects for owner ID: {}", ownerId);
            projects = projectService.getProjectsByOwner(ownerId);
        } else {
            // If no ownerId specified, return all for ADMIN, else return current user's projects
            if (currentUser.getRole() == User.Role.ADMIN) {
                log.info("Fetching all projects (Admin request).");
                projects = projectService.getAllProjects();
            } else {
                log.info("Fetching projects for current user: {}", currentUser.getId());
                projects = projectService.getProjectsByOwner(currentUser.getId());
            }
        }
        return ResponseEntity.ok(projects);
    }


    // Update project
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @projectService.getProjectEntityById(#id).getOwner().getId().equals(@authService.getCurrentAuthenticatedUser().getId())")
    public ResponseEntity<ProjectDTO> updateProject(@PathVariable UUID id, @Valid @RequestBody ProjectDTO projectDTO) {
        log.info("Updating project with ID: {}", id);
        ProjectDTO updatedProject = projectService.updateProject(id, projectDTO);
        return ResponseEntity.ok(updatedProject);
    }

    // Delete project
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @projectService.getProjectEntityById(#id).getOwner().getId().equals(@authService.getCurrentAuthenticatedUser().getId())")
    public ResponseEntity<Void> deleteProject(@PathVariable UUID id) {
        log.info("Deleting project with ID: {}", id);
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }
}
```