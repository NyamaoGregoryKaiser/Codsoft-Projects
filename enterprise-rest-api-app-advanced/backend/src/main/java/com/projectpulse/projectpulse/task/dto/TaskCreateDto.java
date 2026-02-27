package com.projectpulse.projectpulse.task.dto;

import com.projectpulse.projectpulse.task.entity.Task;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TaskCreateDto {
    @NotBlank(message = "Task title is required")
    @Size(min = 3, max = 100, message = "Task title must be between 3 and 100 characters")
    private String title;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    @NotNull(message = "Project ID is required")
    private Long projectId;

    private Long assignedToUserId; // Optional
    private Task.Status status = Task.Status.PENDING;
}