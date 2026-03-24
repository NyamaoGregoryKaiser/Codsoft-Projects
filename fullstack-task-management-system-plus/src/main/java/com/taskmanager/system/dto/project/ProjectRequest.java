package com.taskmanager.system.dto.project;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProjectRequest {
    @NotBlank(message = "Project name is required")
    @Size(min = 3, max = 100, message = "Project name must be between 3 and 100 characters")
    private String name;

    @Size(max = 500, message = "Project description cannot exceed 500 characters")
    private String description;
}