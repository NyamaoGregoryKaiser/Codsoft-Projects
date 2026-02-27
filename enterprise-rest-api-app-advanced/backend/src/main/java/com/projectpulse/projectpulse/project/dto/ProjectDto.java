package com.projectpulse.projectpulse.project.dto;

import com.projectpulse.projectpulse.task.dto.TaskDto;
import com.projectpulse.projectpulse.user.dto.UserDto;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class ProjectDto {
    private Long id;
    private String name;
    private String description;
    private UserDto createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<TaskDto> tasks;
}