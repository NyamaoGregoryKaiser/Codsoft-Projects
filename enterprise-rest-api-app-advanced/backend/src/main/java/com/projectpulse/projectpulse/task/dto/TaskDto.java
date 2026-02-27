package com.projectpulse.projectpulse.task.dto;

import com.projectpulse.projectpulse.task.entity.Task;
import com.projectpulse.projectpulse.user.dto.UserDto;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TaskDto {
    private Long id;
    private String title;
    private String description;
    private Task.Status status;
    private Long projectId;
    private UserDto assignedTo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}