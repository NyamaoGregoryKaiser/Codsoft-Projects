package com.projectpulse.projectpulse.util;

import com.projectpulse.projectpulse.project.dto.ProjectCreateDto;
import com.projectpulse.projectpulse.project.dto.ProjectDto;
import com.projectpulse.projectpulse.project.entity.Project;
import com.projectpulse.projectpulse.task.dto.TaskCreateDto;
import com.projectpulse.projectpulse.task.dto.TaskDto;
import com.projectpulse.projectpulse.task.entity.Task;
import com.projectpulse.projectpulse.user.dto.UserDto;
import com.projectpulse.projectpulse.user.dto.UserRegisterDto;
import com.projectpulse.projectpulse.user.entity.User;

import java.util.Collections;
import java.util.Optional;
import java.util.stream.Collectors;

public class Mappers {

    public static User toUserEntity(UserRegisterDto registerDto) {
        User user = new User();
        user.setUsername(registerDto.getUsername());
        user.setEmail(registerDto.getEmail());
        // Password is set and encoded in service layer
        user.setRole(User.Role.USER); // Default role
        return user;
    }

    public static UserDto toUserDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }

    public static Project toProjectEntity(ProjectCreateDto createDto) {
        Project project = new Project();
        project.setName(createDto.getName());
        project.setDescription(createDto.getDescription());
        return project;
    }

    public static ProjectDto toProjectDto(Project project) {
        ProjectDto dto = new ProjectDto();
        dto.setId(project.getId());
        dto.setName(project.getName());
        dto.setDescription(project.getDescription());
        dto.setCreatedBy(Optional.ofNullable(project.getCreatedBy()).map(Mappers::toUserDto).orElse(null));
        dto.setCreatedAt(project.getCreatedAt());
        dto.setUpdatedAt(project.getUpdatedAt());
        dto.setTasks(Optional.ofNullable(project.getTasks())
                .orElse(Collections.emptyList())
                .stream()
                .map(Mappers::toTaskDto)
                .collect(Collectors.toList()));
        return dto;
    }

    public static Task toTaskEntity(TaskCreateDto createDto) {
        Task task = new Task();
        task.setTitle(createDto.getTitle());
        task.setDescription(createDto.getDescription());
        task.setStatus(createDto.getStatus());
        // Project and assignedTo user are set in service layer
        return task;
    }

    public static TaskDto toTaskDto(Task task) {
        TaskDto dto = new TaskDto();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setDescription(task.getDescription());
        dto.setStatus(task.getStatus());
        dto.setProjectId(Optional.ofNullable(task.getProject()).map(Project::getId).orElse(null));
        dto.setAssignedTo(Optional.ofNullable(task.getAssignedTo()).map(Mappers::toUserDto).orElse(null));
        dto.setCreatedAt(task.getCreatedAt());
        dto.setUpdatedAt(task.getUpdatedAt());
        return dto;
    }
}