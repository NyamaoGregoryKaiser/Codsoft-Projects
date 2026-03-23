```java
package com.tasksyncpro.tasksyncpro.controller;

import com.tasksyncpro.tasksyncpro.dto.ProjectDto;
import com.tasksyncpro.tasksyncpro.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@Slf4j
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Project Management", description = "APIs for managing projects")
public class ProjectController {

    private final ProjectService projectService;

    @Operation(summary = "Create a new project", responses = {
        @ApiResponse(responseCode = "201", description = "Project created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input or owner not found")
    })
    @PostMapping
    @PreAuthorize("hasRole('USER')") // Any authenticated user can create a project
    public ResponseEntity<ProjectDto> createProject(@Valid @RequestBody ProjectDto projectDto) {
        log.info("POST /api/projects - Creating new project: {}", projectDto.getName());
        ProjectDto createdProject = projectService.createProject(projectDto);
        return new ResponseEntity<>(createdProject, HttpStatus.CREATED);
    }

    @Operation(summary = "Get a project by ID", responses = {
        @ApiResponse(responseCode = "200", description = "Project found"),
        @ApiResponse(responseCode = "404", description = "Project not found")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER') and (@securityService.isProjectOwner(#id) or @securityService.isProjectMember(#id))")
    public ResponseEntity<ProjectDto> getProjectById(@PathVariable Long id) {
        log.debug("GET /api/projects/{}", id);
        return ResponseEntity.ok(projectService.getProjectById(id));
    }

    @Operation(summary = "Get all projects (paginated, ADMIN only or user's projects)", responses = {
        @ApiResponse(responseCode = "200", description = "List of projects"),
        @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')") // Admin can see all, regular users can see their own via a separate endpoint
    public ResponseEntity<Page<ProjectDto>> getAllProjects(Pageable pageable) {
        log.debug("GET /api/projects with pagination: {}", pageable);
        return ResponseEntity.ok(projectService.getAllProjects(pageable));
    }

    @Operation(summary = "Get projects owned by the authenticated user", responses = {
        @ApiResponse(responseCode = "200", description = "List of projects"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @GetMapping("/my-projects")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<ProjectDto>> getMyProjects() {
        // In a real app, you'd get the current user's ID from security context
        Long currentUserId = 1L; // Placeholder for demonstration. Replace with actual user ID from JWT token.
        log.debug("GET /api/projects/my-projects for user ID: {}", currentUserId);
        return ResponseEntity.ok(projectService.getProjectsByOwner(currentUserId));
    }


    @Operation(summary = "Update a project by ID", responses = {
        @ApiResponse(responseCode = "200", description = "Project updated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input"),
        @ApiResponse(responseCode = "404", description = "Project not found")
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER') and @securityService.isProjectOwner(#id)")
    public ResponseEntity<ProjectDto> updateProject(@PathVariable Long id, @Valid @RequestBody ProjectDto projectDto) {
        log.info("PUT /api/projects/{} - Updating project details", id);
        return ResponseEntity.ok(projectService.updateProject(id, projectDto));
    }

    @Operation(summary = "Delete a project by ID", responses = {
        @ApiResponse(responseCode = "204", description = "Project deleted successfully"),
        @ApiResponse(responseCode = "404", description = "Project not found")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER') and @securityService.isProjectOwner(#id)")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        log.info("DELETE /api/projects/{} - Deleting project", id);
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }
}
```