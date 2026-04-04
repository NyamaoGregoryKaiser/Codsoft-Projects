package com.example.secureprojectmanagement.web.controller;

import com.example.secureprojectmanagement.model.Task;
import com.example.secureprojectmanagement.model.User;
import com.example.secureprojectmanagement.service.CustomUserDetailsService;
import com.example.secureprojectmanagement.service.TaskService;
import com.example.secureprojectmanagement.web.dto.TaskDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
public class TaskController {

    private final TaskService taskService;
    private final CustomUserDetailsService userDetailsService;

    // --- API Endpoints ---
    @GetMapping("/api/projects/{projectId}/tasks")
    public ResponseEntity<List<TaskDTO>> getTasksByProjectIdAPI(@PathVariable Long projectId, @AuthenticationPrincipal User currentUser) {
        List<TaskDTO> tasks = taskService.getTasksByProjectId(projectId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/api/projects/{projectId}/tasks/{taskId}")
    public ResponseEntity<TaskDTO> getTaskByIdAPI(@PathVariable Long projectId, @PathVariable Long taskId, @AuthenticationPrincipal User currentUser) {
        Task task = taskService.getTaskById(projectId, taskId);
        return ResponseEntity.ok(convertToDTO(task));
    }

    @PostMapping("/api/projects/{projectId}/tasks")
    public ResponseEntity<TaskDTO> createTaskAPI(@PathVariable Long projectId, @Valid @RequestBody TaskDTO taskDTO, @AuthenticationPrincipal User currentUser) {
        Task createdTask = taskService.createTask(projectId, taskDTO, currentUser.getId());
        return new ResponseEntity<>(convertToDTO(createdTask), HttpStatus.CREATED);
    }

    @PutMapping("/api/projects/{projectId}/tasks/{taskId}")
    public ResponseEntity<TaskDTO> updateTaskAPI(@PathVariable Long projectId, @PathVariable Long taskId, @Valid @RequestBody TaskDTO taskDTO, @AuthenticationPrincipal User currentUser) {
        Task updatedTask = taskService.updateTask(projectId, taskId, taskDTO);
        return ResponseEntity.ok(convertToDTO(updatedTask));
    }

    @DeleteMapping("/api/projects/{projectId}/tasks/{taskId}")
    public ResponseEntity<Void> deleteTaskAPI(@PathVariable Long projectId, @PathVariable Long taskId, @AuthenticationPrincipal User currentUser) {
        taskService.deleteTask(projectId, taskId);
        return ResponseEntity.noContent().build();
    }

    // --- UI Endpoints ---

    // Display form to create a new task
    @GetMapping("/projects/{projectId}/tasks/new")
    public String showCreateTaskForm(@PathVariable Long projectId, Model model) {
        model.addAttribute("taskDTO", new TaskDTO());
        model.addAttribute("projectId", projectId);
        model.addAttribute("taskStatuses", Task.TaskStatus.values());
        model.addAttribute("taskPriorities", Task.TaskPriority.values());
        model.addAttribute("users", userDetailsService.userRepository.findAll()); // For assigning tasks
        return "task-form";
    }

    // Handle creation of a new task from UI form
    @PostMapping("/projects/{projectId}/tasks")
    public String createTask(@PathVariable Long projectId,
                             @Valid @ModelAttribute("taskDTO") TaskDTO taskDTO,
                             BindingResult result,
                             Principal principal,
                             RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            model.addAttribute("projectId", projectId);
            model.addAttribute("taskStatuses", Task.TaskStatus.values());
            model.addAttribute("taskPriorities", Task.TaskPriority.values());
            model.addAttribute("users", userDetailsService.userRepository.findAll());
            return "task-form";
        }
        User currentUser = userDetailsService.loadUserByUsername(principal.getName());
        taskService.createTask(projectId, taskDTO, currentUser.getId());
        redirectAttributes.addFlashAttribute("message", "Task created successfully!");
        return "redirect:/projects/" + projectId + "/tasks";
    }

    // Display form to edit an existing task
    @GetMapping("/projects/{projectId}/tasks/{taskId}/edit")
    public String showEditTaskForm(@PathVariable Long projectId, @PathVariable Long taskId, Model model, Principal principal) {
        User currentUser = userDetailsService.loadUserByUsername(principal.getName());
        Task task = taskService.getTaskById(projectId, taskId); // Auth check in service
        model.addAttribute("taskDTO", convertToDTO(task));
        model.addAttribute("projectId", projectId);
        model.addAttribute("taskId", taskId);
        model.addAttribute("taskStatuses", Task.TaskStatus.values());
        model.addAttribute("taskPriorities", Task.TaskPriority.values());
        model.addAttribute("users", userDetailsService.userRepository.findAll());
        return "task-form";
    }

    // Handle update of an existing task from UI form
    @PostMapping("/projects/{projectId}/tasks/{taskId}")
    public String updateTask(@PathVariable Long projectId, @PathVariable Long taskId,
                             @Valid @ModelAttribute("taskDTO") TaskDTO taskDTO,
                             BindingResult result,
                             Principal principal,
                             RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            model.addAttribute("projectId", projectId);
            model.addAttribute("taskId", taskId);
            model.addAttribute("taskStatuses", Task.TaskStatus.values());
            model.addAttribute("taskPriorities", Task.TaskPriority.values());
            model.addAttribute("users", userDetailsService.userRepository.findAll());
            return "task-form";
        }
        User currentUser = userDetailsService.loadUserByUsername(principal.getName());
        taskService.updateTask(projectId, taskId, taskDTO); // Auth check in service
        redirectAttributes.addFlashAttribute("message", "Task updated successfully!");
        return "redirect:/projects/" + projectId + "/tasks";
    }

    // Handle deletion of a task from UI
    @PostMapping("/projects/{projectId}/tasks/{taskId}/delete")
    public String deleteTask(@PathVariable Long projectId, @PathVariable Long taskId, Principal principal, RedirectAttributes redirectAttributes) {
        User currentUser = userDetailsService.loadUserByUsername(principal.getName());
        taskService.deleteTask(projectId, taskId); // Auth check in service
        redirectAttributes.addFlashAttribute("message", "Task deleted successfully!");
        return "redirect:/projects/" + projectId + "/tasks";
    }


    private TaskDTO convertToDTO(Task task) {
        TaskDTO dto = new TaskDTO();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setDescription(task.getDescription());
        dto.setStatus(task.getStatus());
        dto.setPriority(task.getPriority());
        dto.setDueDate(task.getDueDate());
        if (task.getAssignedTo() != null) {
            dto.setAssignedToId(task.getAssignedTo().getId());
        }
        return dto;
    }
}