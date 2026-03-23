```java
package com.tasksyncpro.tasksyncpro.controller;

import com.tasksyncpro.tasksyncpro.dto.TaskDto;
import com.tasksyncpro.tasksyncpro.service.TaskService;
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
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@Slf4j
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Task Management", description = "APIs for managing tasks")
public class TaskController {

    private final TaskService taskService;

    @Operation(summary = "Create a new task", responses = {
        @ApiResponse(responseCode = "201", description = "Task created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input or project/user not found")
    })
    @PostMapping
    @PreAuthorize("hasRole('USER') and @securityService.isProjectMember(#taskDto.projectId)")
    public ResponseEntity<TaskDto> createTask(@Valid @RequestBody TaskDto taskDto) {
        log.info("POST /api/tasks - Creating new task: {}", taskDto.getTitle());
        TaskDto createdTask = taskService.createTask(taskDto);
        return new ResponseEntity<>(createdTask, HttpStatus.CREATED);
    }

    @Operation(summary = "Get a task by ID", responses = {
        @ApiResponse(responseCode = "200", description = "Task found"),
        @ApiResponse(responseCode = "404", description = "Task not found")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER') and @securityService.isTaskMember(#id)")
    public ResponseEntity<TaskDto> getTaskById(@PathVariable Long id) {
        log.debug("GET /api/tasks/{}", id);
        return ResponseEntity.ok(taskService.getTaskById(id));
    }

    @Operation(summary = "Get all tasks (paginated)", responses = {
        @ApiResponse(responseCode = "200", description = "List of tasks"),
        @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')") // Admin can see all, regular users can see their own or project tasks
    public ResponseEntity<Page<TaskDto>> getAllTasks(Pageable pageable) {
        log.debug("GET /api/tasks with pagination: {}", pageable);
        return ResponseEntity.ok(taskService.getAllTasks(pageable));
    }

    @Operation(summary = "Get tasks by project ID", responses = {
        @ApiResponse(responseCode = "200", description = "List of tasks for the project"),
        @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    @GetMapping("/project/{projectId}")
    @PreAuthorize("hasRole('USER') and @securityService.isProjectMember(#projectId)")
    public ResponseEntity<List<TaskDto>> getTasksByProjectId(@PathVariable Long projectId) {
        log.debug("GET /api/tasks/project/{}", projectId);
        return ResponseEntity.ok(taskService.getTasksByProjectId(projectId));
    }

    @Operation(summary = "Get tasks assigned to a specific user ID", responses = {
        @ApiResponse(responseCode = "200", description = "List of tasks assigned to the user"),
        @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    @GetMapping("/assigned-to/{userId}")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isOwner(#userId)")
    public ResponseEntity<List<TaskDto>> getTasksByAssignedToId(@PathVariable Long userId) {
        log.debug("GET /api/tasks/assigned-to/{}", userId);
        return ResponseEntity.ok(taskService.getTasksByAssignedToId(userId));
    }

    @Operation(summary = "Update a task by ID", responses = {
        @ApiResponse(responseCode = "200", description = "Task updated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input"),
        @ApiResponse(responseCode = "404", description = "Task not found")
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER') and @securityService.isTaskMember(#id)")
    public ResponseEntity<TaskDto> updateTask(@PathVariable Long id, @Valid @RequestBody TaskDto taskDto) {
        log.info("PUT /api/tasks/{} - Updating task details", id);
        return ResponseEntity.ok(taskService.updateTask(id, taskDto));
    }

    @Operation(summary = "Delete a task by ID", responses = {
        @ApiResponse(responseCode = "204", description = "Task deleted successfully"),
        @ApiResponse(responseCode = "404", description = "Task not found")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER') and @securityService.isTaskMember(#id)") // Only members can delete their tasks
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        log.info("DELETE /api/tasks/{} - Deleting task", id);
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }
}
```