package com.projectpulse.projectpulse.task.controller;

import com.projectpulse.projectpulse.task.dto.TaskCreateDto;
import com.projectpulse.projectpulse.task.dto.TaskDto;
import com.projectpulse.projectpulse.task.dto.TaskUpdateDto;
import com.projectpulse.projectpulse.task.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
@Tag(name = "Tasks", description = "Task management APIs")
@SecurityRequirement(name = "bearerAuth")
public class TaskController {

    private final TaskService taskService;

    @Operation(summary = "Create a new task")
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<TaskDto> createTask(@Valid @RequestBody TaskCreateDto createDto) {
        TaskDto newTask = taskService.createTask(createDto);
        return new ResponseEntity<>(newTask, HttpStatus.CREATED);
    }

    @Operation(summary = "Get a task by ID")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<TaskDto> getTaskById(@PathVariable Long id) {
        TaskDto task = taskService.getTaskById(id);
        return ResponseEntity.ok(task);
    }

    @Operation(summary = "Get all tasks for a specific project")
    @GetMapping("/project/{projectId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<TaskDto>> getTasksByProjectId(@PathVariable Long projectId) {
        List<TaskDto> tasks = taskService.getTasksByProjectId(projectId);
        return ResponseEntity.ok(tasks);
    }

    @Operation(summary = "Get all tasks assigned to the current user")
    @GetMapping("/my-tasks")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<TaskDto>> getTasksAssignedToCurrentUser() {
        List<TaskDto> tasks = taskService.getTasksAssignedToCurrentUser();
        return ResponseEntity.ok(tasks);
    }

    @Operation(summary = "Update an existing task by ID")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')") // Further authorization handled in service layer
    public ResponseEntity<TaskDto> updateTask(@PathVariable Long id, @Valid @RequestBody TaskUpdateDto updateDto) {
        TaskDto updatedTask = taskService.updateTask(id, updateDto);
        return ResponseEntity.ok(updatedTask);
    }

    @Operation(summary = "Delete a task by ID")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')") // Further authorization handled in service layer
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }
}