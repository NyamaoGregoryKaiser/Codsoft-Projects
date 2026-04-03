```java
package com.example.authsystem.task.controller;

import com.example.authsystem.common.exception.ResourceNotFoundException;
import com.example.authsystem.task.dto.TaskDTO;
import com.example.authsystem.task.service.TaskService;
import com.example.authsystem.user.model.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for managing user tasks.
 */
@RestController
@RequestMapping("/tasks")
@RequiredArgsConstructor
@Slf4j
public class TaskController {

    private final TaskService taskService;

    /**
     * Creates a new task for the authenticated user.
     *
     * @param currentUser The authenticated user details.
     * @param taskDTO The TaskDTO containing details for the new task.
     * @return ResponseEntity containing the created TaskDTO.
     */
    @PostMapping
    public ResponseEntity<TaskDTO> createTask(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody TaskDTO taskDTO) {
        log.info("User {} creating new task.", currentUser.getEmail());
        TaskDTO createdTask = taskService.createTask(currentUser.getId(), taskDTO);
        return new ResponseEntity<>(createdTask, HttpStatus.CREATED);
    }

    /**
     * Retrieves all tasks for the authenticated user.
     *
     * @param currentUser The authenticated user details.
     * @return ResponseEntity containing a list of TaskDTOs.
     */
    @GetMapping
    public ResponseEntity<List<TaskDTO>> getAllTasksForUser(@AuthenticationPrincipal User currentUser) {
        log.info("Fetching all tasks for user: {}", currentUser.getEmail());
        List<TaskDTO> tasks = taskService.getTasksByUserId(currentUser.getId());
        return ResponseEntity.ok(tasks);
    }

    /**
     * Retrieves a specific task by ID for the authenticated user.
     *
     * @param currentUser The authenticated user details.
     * @param taskId The ID of the task to retrieve.
     * @return ResponseEntity containing the TaskDTO.
     * @throws ResourceNotFoundException if the task is not found or doesn't belong to the user.
     */
    @GetMapping("/{taskId}")
    public ResponseEntity<TaskDTO> getTaskById(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long taskId) {
        log.info("Fetching task ID: {} for user: {}", taskId, currentUser.getEmail());
        TaskDTO task = taskService.getTaskByIdAndUserId(taskId, currentUser.getId())
                .orElseThrow(() -> {
                    log.warn("Task ID: {} not found or not owned by user: {}", taskId, currentUser.getEmail());
                    return new ResourceNotFoundException("Task not found or unauthorized for id: " + taskId);
                });
        return ResponseEntity.ok(task);
    }

    /**
     * Updates an existing task for the authenticated user.
     *
     * @param currentUser The authenticated user details.
     * @param taskId The ID of the task to update.
     * @param taskDTO The TaskDTO with updated task details.
     * @return ResponseEntity containing the updated TaskDTO.
     * @throws ResourceNotFoundException if the task is not found or doesn't belong to the user.
     */
    @PutMapping("/{taskId}")
    public ResponseEntity<TaskDTO> updateTask(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long taskId,
            @Valid @RequestBody TaskDTO taskDTO) {
        log.info("User {} updating task ID: {}", currentUser.getEmail(), taskId);
        TaskDTO updatedTask = taskService.updateTask(taskId, currentUser.getId(), taskDTO);
        return ResponseEntity.ok(updatedTask);
    }

    /**
     * Deletes a task for the authenticated user.
     *
     * @param currentUser The authenticated user details.
     * @param taskId The ID of the task to delete.
     * @return ResponseEntity with no content.
     * @throws ResourceNotFoundException if the task is not found or doesn't belong to the user.
     */
    @DeleteMapping("/{taskId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> deleteTask(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long taskId) {
        log.info("User {} deleting task ID: {}", currentUser.getEmail(), taskId);
        taskService.deleteTask(taskId, currentUser.getId());
        return ResponseEntity.noContent().build();
    }
}
```