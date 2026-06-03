```java
package com.taskflow.project.controller;

import com.taskflow.project.dto.ProjectDTO;
import com.taskflow.project.model.Project;
import com.taskflow.project.service.ProjectService;
import com.taskflow.user.model.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@Slf4j
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Project Management", description = "CRUD operations for Projects")
public class ProjectController {

    private final ProjectService projectService;

    @Operation(summary = "Get project by ID",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Project found"),
                    @ApiResponse(responseCode = "404", description = "Project not found")
            })
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER') and @projectAccessChecker.canAccessProject(#id, @authenticationPrincipal.id)")
    public ResponseEntity<ProjectDTO> getProjectById(@PathVariable UUID id) {
        log.info("Request to get project with ID: {}", id);
        Project project = projectService.getProjectById(id);
        return ResponseEntity.ok(ProjectDTO.fromEntity(project));
    }

    @Operation(summary = "Get all projects (paginated)",
            responses = @ApiResponse(responseCode = "200", description = "List of projects"))
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Page<ProjectDTO>> getAllProjects(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        log.info("Request to get all projects (page: {}, size: {})", page, size);
        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name()) ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Project> projects = projectService.getAllProjectsPaged(pageable);
        return ResponseEntity.ok(projects.map(ProjectDTO::fromEntity));
    }

    @Operation(summary = "Create a new project",
            responses = {
                    @ApiResponse(responseCode = "201", description = "Project created"),
                    @ApiResponse(responseCode = "400", description = "Invalid project data")
            })
    @PostMapping
    @PreAuthorize("hasRole('USER')") // Only authenticated users can create projects
    public ResponseEntity<ProjectDTO> createProject(@Valid @RequestBody ProjectDTO projectDTO, @AuthenticationPrincipal User currentUser) {
        log.info("Request to create project: {} by user {}", projectDTO.getName(), currentUser.getUsername());
        Project createdProject = projectService.createProject(projectDTO, currentUser.getId());
        return new ResponseEntity<>(ProjectDTO.fromEntity(createdProject), HttpStatus.CREATED);
    }

    @Operation(summary = "Update an existing project",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Project updated"),
                    @ApiResponse(responseCode = "404", description = "Project not found"),
                    @ApiResponse(responseCode = "403", description = "Not authorized to update project")
            })
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN') or (@projectAccessChecker.isProjectOwner(#id, @authenticationPrincipal.id))")
    public ResponseEntity<ProjectDTO> updateProject(@PathVariable UUID id, @Valid @RequestBody ProjectDTO projectDTO) {
        log.info("Request to update project with ID: {}", id);
        Project updatedProject = projectService.updateProject(id, projectDTO);
        return ResponseEntity.ok(ProjectDTO.fromEntity(updatedProject));
    }

    @Operation(summary = "Delete a project",
            responses = {
                    @ApiResponse(responseCode = "204", description = "Project deleted"),
                    @ApiResponse(responseCode = "404", description = "Project not found"),
                    @ApiResponse(responseCode = "403", description = "Not authorized to delete project")
            })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN') or (@projectAccessChecker.isProjectOwner(#id, @authenticationPrincipal.id))")
    public ResponseEntity<Void> deleteProject(@PathVariable UUID id) {
        log.info("Request to delete project with ID: {}", id);
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Get projects owned by the current user",
            responses = @ApiResponse(responseCode = "200", description = "List of projects owned by the user"))
    @GetMapping("/my-projects")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<ProjectDTO>> getMyProjects(@AuthenticationPrincipal User currentUser) {
        log.info("Request to get projects for current user: {}", currentUser.getUsername());
        List<Project> projects = projectService.getProjectsByOwner(currentUser.getId());
        return ResponseEntity.ok(projects.stream().map(ProjectDTO::fromEntity).collect(Collectors.toList()));
    }

    // Helper bean for @PreAuthorize
    @Component("projectAccessChecker")
    public static class ProjectAccessChecker {
        private final ProjectService projectService;
        public ProjectAccessChecker(ProjectService projectService) {
            this.projectService = projectService;
        }

        public boolean isProjectOwner(UUID projectId, UUID userId) {
            Project project = projectService.getProjectById(projectId);
            return project.getOwner().getId().equals(userId);
        }

        public boolean canAccessProject(UUID projectId, UUID userId) {
            try {
                Project project = projectService.getProjectById(projectId);
                return project.getOwner().getId().equals(userId) ||
                       project.getTasks().stream().anyMatch(task -> task.getAssignee() != null && task.getAssignee().getId().equals(userId));
            } catch (Exception e) {
                // If project not found, or any other error, deny access
                return false;
            }
        }
    }
}
```