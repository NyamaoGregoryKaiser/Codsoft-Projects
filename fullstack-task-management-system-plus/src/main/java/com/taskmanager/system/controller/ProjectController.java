package com.taskmanager.system.controller;

import com.taskmanager.system.dto.project.ProjectDto;
import com.taskmanager.system.dto.project.ProjectRequest;
import com.taskmanager.system.service.ProjectService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@AllArgsConstructor
public class ProjectController {

    private ProjectService projectService;

    // Helper to get authenticated user ID (simplified, in a real app, use custom principal or security context)
    private Long getCurrentUserId(UserDetails userDetails) {
        // In a real app, you'd get the User ID from the JWT token/custom UserDetails object
        // For this example, let's assume username is the ID (or we fetch from DB)
        // This is a simplification. A production app would store user ID in JWT claims.
        // For now, we'll fetch from repo using username.
        // Or better, create a custom UserDetails object to hold the ID.
        // For demonstration, let's assume we can resolve it.
        // Example: User user = userRepository.findByUsername(userDetails.getUsername()).orElseThrow(...)
        // return user.getId();
        return 1L; // Placeholder for demonstration. Implement actual ID retrieval.
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @PostMapping
    public ResponseEntity<ProjectDto> createProject(
            @AuthenticationPrincipal UserDetails currentUser,
            @Valid @RequestBody ProjectRequest projectRequest) {
        Long userId = getCurrentUserId(currentUser); // This needs proper implementation
        ProjectDto newProject = projectService.createProject(userId, projectRequest);
        return new ResponseEntity<>(newProject, HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @GetMapping("/{id}")
    public ResponseEntity<ProjectDto> getProjectById(@PathVariable("id") Long projectId) {
        ProjectDto projectDto = projectService.getProjectById(projectId);
        return new ResponseEntity<>(projectDto, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @GetMapping
    public ResponseEntity<Page<ProjectDto>> getAllProjects(
            @RequestParam(value = "pageNo", defaultValue = "0", required = false) int pageNo,
            @RequestParam(value = "pageSize", defaultValue = "10", required = false) int pageSize,
            @RequestParam(value = "sortBy", defaultValue = "createdAt", required = false) String sortBy,
            @RequestParam(value = "sortDir", defaultValue = "asc", required = false) String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name()) ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(pageNo, pageSize, sort);
        Page<ProjectDto> projects = projectService.getAllProjects(pageable);
        return new ResponseEntity<>(projects, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @GetMapping("/my-projects")
    public ResponseEntity<List<ProjectDto>> getMyProjects(@AuthenticationPrincipal UserDetails currentUser) {
        Long userId = getCurrentUserId(currentUser); // This needs proper implementation
        List<ProjectDto> projects = projectService.getProjectsByUserId(userId);
        return new ResponseEntity<>(projects, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @PutMapping("/{id}")
    public ResponseEntity<ProjectDto> updateProject(
            @AuthenticationPrincipal UserDetails currentUser,
            @PathVariable("id") Long projectId,
            @Valid @RequestBody ProjectRequest projectRequest) {
        Long userId = getCurrentUserId(currentUser); // This needs proper implementation
        ProjectDto updatedProject = projectService.updateProject(userId, projectId, projectRequest);
        return new ResponseEntity<>(updatedProject, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteProject(
            @AuthenticationPrincipal UserDetails currentUser,
            @PathVariable("id") Long projectId) {
        Long userId = getCurrentUserId(currentUser); // This needs proper implementation
        projectService.deleteProject(userId, projectId);
        return new ResponseEntity<>("Project deleted successfully.", HttpStatus.OK);
    }
}