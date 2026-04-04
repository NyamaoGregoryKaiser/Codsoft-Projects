package com.example.secureprojectmanagement.web.dto;

import com.example.secureprojectmanagement.model.Task;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Data
public class TaskDTO {
    private Long id; // For update operations

    @NotBlank(message = "Task title is required")
    @Size(max = 255, message = "Task title cannot exceed 255 characters")
    private String title;

    private String description;

    @NotNull(message = "Task status is required")
    private Task.TaskStatus status;

    @NotNull(message = "Task priority is required")
    private Task.TaskPriority priority;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate dueDate;

    private Long assignedToId;
}