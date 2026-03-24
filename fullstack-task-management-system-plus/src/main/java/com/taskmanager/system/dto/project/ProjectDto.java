package com.taskmanager.system.dto.project;

import com.taskmanager.system.dto.user.UserDto;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ProjectDto {
    private Long id;
    private String name;
    private String description;
    private UserDto createdBy; // Simplified UserDto for owner
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}