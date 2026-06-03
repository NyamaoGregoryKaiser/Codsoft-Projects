```java
package com.taskflow.task.controller;

import com.taskflow.project.model.Project;
import com.taskflow.project.service.ProjectService;
import com.taskflow.task.dto.TaskDTO;
import com.taskflow.task.model.Task;
import com.taskflow.task.service.TaskService;
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
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@Slf4j
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Task Management", description = "CRUD operations for Tasks")
public class TaskController {

    private final TaskService taskService;
    private final ProjectService projectService;

    @Operation(summary = "Get task by ID",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Task found"),
                    @ApiResponse(responseCode = "404", description = "Task not found")
            })
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER') and @taskAccessChecker.canAccessTask(#id, @authenticationPrincipal.id)")
    public ResponseEntity<TaskDTO> getTaskById(@PathVariable UUID id) {
        log.info("Request to get task with ID: {}", id);
        Task task = taskService.getTaskById(id);
        return ResponseEntity.ok(TaskDTO.fromEntity(task));
    }

    @Operation(summary = "Get all tasks (paginated)",
            responses = @ApiResponse(responseCode = "200", description = "List of tasks"))
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Page<TaskDTO>> getAllTasks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @AuthenticationPrincipal User currentUser) { // Inject current user
        log.info("Request to get all tasks (page: {}, size: {}) for user {}", page, size, currentUser.getUsername());
        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name()) ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Task> tasks = taskService.getAllTasksPaged(pageable);
        // Filter tasks for regular users to only show those they are involved in
        if (currentUser.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            tasks = tasks.map(task -> task); // Just map for now, filtering can be done in service layer for better performance
            // In a real app, this filtering would be done in the service/repository layer via custom query for performance
            // For example, find tasks where owner_id = currentUser.id OR assignee_id = currentUser.id
            List<Task> filteredTasks = tasks.getContent().stream()
                    .filter(task -> (task.getProject() != null && task.getProject().getOwner().getId().equals(currentUser.getId())) ||
                                    (task.getAssignee() != null && task.getAssignee().getId().equals(currentUser.getId())))
                    .collect(Collectors.toList());
            // Need to recreate Page to reflect filtered content. This is inefficient for large datasets.
            // A custom Spring Data JPA query method would be better for production.
            return ResponseEntity.ok(new PageImpl<>(filteredTasks.stream().map(TaskDTO::fromEntity).collect(Collectors.toList()), pageable, filteredTasks.size()));
        }

        return ResponseEntity.ok(tasks.map(TaskDTO::fromEntity));
    }

    @Operation(summary = "Create a new task for a project",
            responses = {
                    @ApiResponse(responseCode = "201", description = "Task created"),
                    @ApiResponse(responseCode = "400", description = "Invalid task data or project not found")
            })
    @PostMapping("/project/{projectId}")
    @PreAuthorize("hasRole('USER') and @projectAccessChecker.isProjectOwner(#projectId, @authenticationPrincipal.id)")
    public ResponseEntity<TaskDTO> createTask(@PathVariable UUID projectId, @Valid @RequestBody TaskDTO taskDTO, @AuthenticationPrincipal User currentUser) {
        log.info("Request to create task in project {}: {} by user {}", projectId, taskDTO.getTitle(), currentUser.getUsername());
        Task createdTask = taskService.createTask(taskDTO, projectId, currentUser.getId());
        return new ResponseEntity<>(TaskDTO.fromEntity(createdTask), HttpStatus.CREATED);
    }

    @Operation(summary = "Update an existing task",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Task updated"),
                    @ApiResponse(responseCode = "404", description = "Task not found"),
                    @ApiResponse(responseCode = "403", description = "Not authorized to update task")
            })
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN') or (@taskAccessChecker.isTaskOwnerOrAssignee(#id, @authenticationPrincipal.id))")
    public ResponseEntity<TaskDTO> updateTask(@PathVariable UUID id, @Valid @RequestBody TaskDTO taskDTO) {
        log.info("Request to update task with ID: {}", id);
        Task updatedTask = taskService.updateTask(id, taskDTO);
        return ResponseEntity.ok(TaskDTO.fromEntity(updatedTask));
    }

    @Operation(summary = "Delete a task",
            responses = {
                    @ApiResponse(responseCode = "204", description = "Task deleted"),
                    @ApiResponse(responseCode = "404", description = "Task not found"),
                    @ApiResponse(responseCode = "403", description = "Not authorized to delete task")
            })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN') or (@taskAccessChecker.isTaskOwner(#id, @authenticationPrincipal.id))")
    public ResponseEntity<Void> deleteTask(@PathVariable UUID id) {
        log.info("Request to delete task with ID: {}", id);
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Get tasks by project ID",
            responses = @ApiResponse(responseCode = "200", description = "List of tasks for a project"))
    @GetMapping("/project/{projectId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER') and @projectAccessChecker.canAccessProject(#projectId, @authenticationPrincipal.id)")
    public ResponseEntity<List<TaskDTO>> getTasksByProjectId(@PathVariable UUID projectId) {
        log.info("Request to get tasks for project ID: {}", projectId);
        List<Task> tasks = taskService.getTasksByProjectId(projectId);
        return ResponseEntity.ok(tasks.stream().map(TaskDTO::fromEntity).collect(Collectors.toList()));
    }

    @Operation(summary = "Get tasks assigned to the current user",
            responses = @ApiResponse(responseCode = "200", description = "List of tasks assigned to the user"))
    @GetMapping("/my-tasks")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<TaskDTO>> getMyTasks(@AuthenticationPrincipal User currentUser) {
        log.info("Request to get tasks assigned to current user: {}", currentUser.getUsername());
        List<Task> tasks = taskService.getTasksByAssigneeId(currentUser.getId());
        return ResponseEntity.ok(tasks.stream().map(TaskDTO::fromEntity).collect(Collectors.toList()));
    }


    // Helper bean for @PreAuthorize
    @Component("taskAccessChecker")
    public static class TaskAccessChecker {
        private final TaskService taskService;
        private final ProjectService projectService;
        public TaskAccessChecker(TaskService taskService, ProjectService projectService) {
            this.taskService = taskService;
            this.projectService = projectService;
        }

        public boolean isTaskOwner(UUID taskId, UUID userId) {
            Task task = taskService.getTaskById(taskId);
            return projectService.getProjectById(task.getProject().getId()).getOwner().getId().equals(userId);
        }

        public boolean isTaskOwnerOrAssignee(UUID taskId, UUID userId) {
            Task task = taskService.getTaskById(taskId);
            return (task.getProject().getOwner().getId().equals(userId) ||
                    (task.getAssignee() != null && task.getAssignee().getId().equals(userId)));
        }

        public boolean canAccessTask(UUID taskId, UUID userId) {
            try {
                Task task = taskService.getTaskById(taskId);
                return (task.getProject().getOwner().getId().equals(userId) ||
                        (task.getAssignee() != null && task.getAssignee().getId().equals(userId)));
            } catch (Exception e) {
                return false;
            }
        }
    }
}
```