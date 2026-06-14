```java
package com.tasks.taskmanagement.controller;

import com.tasks.taskmanagement.dto.TaskDTO;
import com.tasks.taskmanagement.entity.Task.Status;
import com.tasks.taskmanagement.entity.User;
import com.tasks.taskmanagement.service.AuthService;
import com.tasks.taskmanagement.service.TaskService;
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
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@Slf4j
public class TaskController {

    private final TaskService taskService;
    private final AuthService authService;

    // Create a new task
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TaskDTO> createTask(@Valid @RequestBody TaskDTO taskDTO) {
        log.info("Received request to create task: {}", taskDTO.getTitle());
        TaskDTO createdTask = taskService.createTask(taskDTO);
        return new ResponseEntity<>(createdTask, HttpStatus.CREATED);
    }

    // Get task by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @taskRepository.isTaskOwnedOrAssignedByUser(#id, @authService.getCurrentAuthenticatedUser().getId())")
    public ResponseEntity<TaskDTO> getTaskById(@PathVariable UUID id) {
        log.info("Fetching task with ID: {}", id);
        TaskDTO task = taskService.getTaskById(id);
        return ResponseEntity.ok(task);
    }

    // Get all tasks (Admin only) or tasks assigned to current user, optionally filtered by project/status
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<TaskDTO>> getAllTasks(
            @RequestParam(required = false) UUID assigneeId,
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) Status status) {

        User currentUser = authService.getCurrentAuthenticatedUser();
        List<TaskDTO> tasks;

        if (assigneeId != null) {
            // If assigneeId is specified, ensure it's the current user or admin
            if (!assigneeId.equals(currentUser.getId()) && currentUser.getRole() != User.Role.ADMIN) {
                log.warn("Unauthorized attempt to fetch tasks for assignee ID: {}", assigneeId);
                return new ResponseEntity<>(HttpStatus.FORBIDDEN);
            }
            log.info("Fetching tasks for assignee ID: {}, Project: {}, Status: {}", assigneeId, projectId, status);
            tasks = taskService.getTasksForUser(assigneeId, projectId, status);
        } else {
            // If no assigneeId specified, return all for ADMIN, else return current user's tasks
            if (currentUser.getRole() == User.Role.ADMIN) {
                log.info("Fetching all tasks (Admin request).");
                tasks = taskService.getAllTasks();
            } else {
                log.info("Fetching tasks for current user: {} (Project: {}, Status: {})", currentUser.getId(), projectId, status);
                tasks = taskService.getTasksForUser(currentUser.getId(), projectId, status);
            }
        }
        return ResponseEntity.ok(tasks);
    }

    // Update task
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @taskRepository.isTaskOwnedOrAssignedByUser(#id, @authService.getCurrentAuthenticatedUser().getId())")
    public ResponseEntity<TaskDTO> updateTask(@PathVariable UUID id, @Valid @RequestBody TaskDTO taskDTO) {
        log.info("Updating task with ID: {}", id);
        TaskDTO updatedTask = taskService.updateTask(id, taskDTO);
        return ResponseEntity.ok(updatedTask);
    }

    // Delete task
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @taskRepository.isTaskOwnedOrAssignedByUser(#id, @authService.getCurrentAuthenticatedUser().getId())")
    public ResponseEntity<Void> deleteTask(@PathVariable UUID id) {
        log.info("Deleting task with ID: {}", id);
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }
}
```