package com.example.secureprojectmanagement.web.controller;

import com.example.secureprojectmanagement.model.Project;
import com.example.secureprojectmanagement.service.ProjectService;
import com.example.secureprojectmanagement.service.CustomUserDetailsService;
import com.example.secureprojectmanagement.web.dto.RegisterRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.security.Principal;
import java.util.List;

@Controller
@RequiredArgsConstructor
public class HomeController {

    private final ProjectService projectService;
    private final CustomUserDetailsService userDetailsService;

    @GetMapping("/")
    public String home(Model model, Principal principal) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication instanceof AnonymousAuthenticationToken) {
            return "redirect:/login"; // Redirect unauthenticated users to login
        }
        // Redirect to projects list if authenticated
        return "redirect:/projects";
    }

    @GetMapping("/login")
    public String login() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && !(authentication instanceof AnonymousAuthenticationToken)) {
            return "redirect:/projects"; // Redirect authenticated users away from login page
        }
        return "login";
    }

    @GetMapping("/register")
    public String registerForm(Model model) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && !(authentication instanceof AnonymousAuthenticationToken)) {
            return "redirect:/projects"; // Redirect authenticated users away from register page
        }
        model.addAttribute("registerRequest", new RegisterRequest());
        return "register";
    }

    // Displays all projects (UI route)
    @GetMapping("/projects")
    public String listProjects(Model model, Principal principal) {
        if (principal == null) {
            return "redirect:/login"; // Should not happen with Spring Security, but good fallback
        }
        List<Project> projects = projectService.getAllProjects();
        model.addAttribute("projects", projects);
        model.addAttribute("currentUser", userDetailsService.loadUserByUsername(principal.getName()));
        return "projects";
    }

    // Displays tasks for a specific project (UI route)
    @GetMapping("/projects/{projectId}/tasks")
    public String listTasks(Model model, @PathVariable Long projectId, Principal principal) {
        if (principal == null) {
            return "redirect:/login";
        }
        Project project = projectService.getProjectById(projectId);
        List<Task> tasks = taskService.getTasksByProjectId(projectId);
        model.addAttribute("project", project);
        model.addAttribute("tasks", tasks);
        model.addAttribute("currentUser", userDetailsService.loadUserByUsername(principal.getName()));
        return "tasks";
    }

    // Dummy endpoint for testing general access control for admins
    @GetMapping("/admin/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public String adminDashboard(Model model) {
        model.addAttribute("message", "Welcome, Admin!");
        return "admin-dashboard"; // You'd need to create this template
    }
}