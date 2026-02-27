package com.projectpulse.projectpulse.task.dto;

import com.projectpulse.projectpulse.task.entity.Task;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TaskUpdateDto {
    @Size(min = 3, max = 100, message = "Task title must be between 3 and 100 characters")
    private String title;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    private Long assignedToUserId; // Can be null to unassign
    private Task.Status status;
}