package com.example.secureprojectmanagement.web.controller;

import com.example.secureprojectmanagement.model.User;
import com.example.secureprojectmanagement.service.ProjectService;
import com.example.secureprojectmanagement.service.CustomUserDetailsService;
import com.example.secureprojectmanagement.web.dto.ProjectDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@Controller
@RequestMapping
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final CustomUserDetailsService userDetailsService;

    // --- API Endpoints ---
    @GetMapping("/api/projects")
    public ResponseEntity<List<ProjectDTO>> getAllProjectsAPI() {
        List<ProjectDTO> projects = projectService.getAllProjects().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/api/projects/{id}")
    public ResponseEntity<ProjectDTO> getProjectByIdAPI(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        com.example.secureprojectmanagement.model.Project project = projectService.getProjectById(id);
        return ResponseEntity.ok(convertToDTO(project));
    }

    @PostMapping("/api/projects")
    public ResponseEntity<ProjectDTO> createProjectAPI(@Valid @RequestBody ProjectDTO projectDTO, @AuthenticationPrincipal User currentUser) {
        com.example.secureprojectmanagement.model.Project createdProject = projectService.createProject(projectDTO, currentUser.getId());
        return new ResponseEntity<>(convertToDTO(createdProject), HttpStatus.CREATED);
    }

    @PutMapping("/api/projects/{id}")
    public ResponseEntity<ProjectDTO> updateProjectAPI(@PathVariable Long id, @Valid @RequestBody ProjectDTO projectDTO, @AuthenticationPrincipal User currentUser) {
        com.example.secureprojectmanagement.model.Project updatedProject = projectService.updateProject(id, projectDTO);
        return ResponseEntity.ok(convertToDTO(updatedProject));
    }

    @DeleteMapping("/api/projects/{id}")
    public ResponseEntity<Void> deleteProjectAPI(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }

    // --- UI Endpoints (for Thymeleaf) ---

    // Display form to create a new project
    @GetMapping("/projects/new")
    public String showCreateProjectForm(Model model) {
        model.addAttribute("projectDTO", new ProjectDTO());
        return "project-form";
    }

    // Handle creation of a new project from UI form
    @PostMapping("/projects")
    public String createProject(@Valid @ModelAttribute("projectDTO") ProjectDTO projectDTO,
                                BindingResult result,
                                Principal principal,
                                RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            return "project-form";
        }
        User currentUser = userDetailsService.loadUserByUsername(principal.getName());
        projectService.createProject(projectDTO, currentUser.getId());
        redirectAttributes.addFlashAttribute("message", "Project created successfully!");
        return "redirect:/projects";
    }

    // Display form to edit an existing project
    @GetMapping("/projects/{id}/edit")
    public String showEditProjectForm(@PathVariable Long id, Model model, Principal principal) {
        User currentUser = userDetailsService.loadUserByUsername(principal.getName());
        com.example.secureprojectmanagement.model.Project project = projectService.getProjectById(id); // Authorization check is in service layer
        model.addAttribute("projectDTO", convertToDTO(project));
        return "project-form";
    }

    // Handle update of an existing project from UI form
    @PostMapping("/projects/{id}")
    public String updateProject(@PathVariable Long id,
                                @Valid @ModelAttribute("projectDTO") ProjectDTO projectDTO,
                                BindingResult result,
                                Principal principal,
                                RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            return "project-form";
        }
        User currentUser = userDetailsService.loadUserByUsername(principal.getName());
        projectService.updateProject(id, projectDTO); // Authorization check is in service layer
        redirectAttributes.addFlashAttribute("message", "Project updated successfully!");
        return "redirect:/projects/" + id + "/tasks"; // Redirect to project tasks
    }

    // Handle deletion of a project from UI
    @PostMapping("/projects/{id}/delete")
    public String deleteProject(@PathVariable Long id, Principal principal, RedirectAttributes redirectAttributes) {
        User currentUser = userDetailsService.loadUserByUsername(principal.getName());
        projectService.deleteProject(id); // Authorization check is in service layer
        redirectAttributes.addFlashAttribute("message", "Project deleted successfully!");
        return "redirect:/projects";
    }

    private ProjectDTO convertToDTO(com.example.secureprojectmanagement.model.Project project) {
        ProjectDTO dto = new ProjectDTO();
        dto.setId(project.getId());
        dto.setName(project.getName());
        dto.setDescription(project.getDescription());
        dto.setStartDate(project.getStartDate());
        dto.setEndDate(project.getEndDate());
        return dto;
    }
}
```