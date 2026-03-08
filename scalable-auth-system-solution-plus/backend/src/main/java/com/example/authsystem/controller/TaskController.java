package com.example.authsystem.controller;

import com.example.authsystem.dto.TaskDto;
import com.example.authsystem.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
@Tag(name = "Task Management", description = "Operations related to user tasks")
public class TaskController {

    private final TaskService taskService;

    @Operation(summary = "Create a new task")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Task created successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = TaskDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PostMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<TaskDto> createTask(@Valid @RequestBody TaskDto taskDto) {
        TaskDto createdTask = taskService.createTask(taskDto);
        return new ResponseEntity<>(createdTask, HttpStatus.CREATED);
    }

    @Operation(summary = "Get a task by ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Task retrieved successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = TaskDto.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Not the owner of the task or not ADMIN"),
            @ApiResponse(responseCode = "404", description = "Task not found")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')") // Role check for ownership done in service layer
    public ResponseEntity<TaskDto> getTaskById(
            @Parameter(description = "ID of the task to retrieve", required = true)
            @PathVariable Long id) {
        TaskDto taskDto = taskService.getTaskById(id);
        return ResponseEntity.ok(taskDto);
    }

    @Operation(summary = "Get all tasks for the current user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "List of tasks retrieved successfully",
                    content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = TaskDto.class)))),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @GetMapping("/my-tasks")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<List<TaskDto>> getMyTasks() {
        List<TaskDto> tasks = taskService.getTasksForCurrentUser();
        return ResponseEntity.ok(tasks);
    }

    @Operation(summary = "Get all tasks (Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "List of all tasks retrieved successfully",
                    content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = TaskDto.class)))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Requires ADMIN role")
    })
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TaskDto>> getAllTasks() {
        List<TaskDto> tasks = taskService.getAllTasks();
        return ResponseEntity.ok(tasks);
    }

    @Operation(summary = "Update an existing task")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Task updated successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = TaskDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Not the owner of the task or not ADMIN"),
            @ApiResponse(responseCode = "404", description = "Task not found")
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')") // Role check for ownership done in service layer
    public ResponseEntity<TaskDto> updateTask(
            @Parameter(description = "ID of the task to update", required = true)
            @PathVariable Long id,
            @Valid @RequestBody TaskDto taskDto) {
        TaskDto updatedTask = taskService.updateTask(id, taskDto);
        return ResponseEntity.ok(updatedTask);
    }

    @Operation(summary = "Delete a task")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Task deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Not the owner of the task or not ADMIN"),
            @ApiResponse(responseCode = "404", description = "Task not found")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')") // Role check for ownership done in service layer
    public ResponseEntity<Void> deleteTask(
            @Parameter(description = "ID of the task to delete", required = true)
            @PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }
}