package com.etms.backend.dto;

import com.etms.backend.model.TaskPriority;
import com.etms.backend.model.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskDTO {
    private Long id;
    @NotBlank(message = "Task title cannot be empty")
    private String title;
    private String description;
    @NotNull(message = "Task status cannot be null")
    private TaskStatus status;
    @NotNull(message = "Task priority cannot be null")
    private TaskPriority priority;
    @NotNull(message = "Project ID cannot be null")
    private Long projectId;
    private Long assignedToId;
    private String assignedToUsername;
    private LocalDateTime dueDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}