package com.projectpulse.projectpulse.task.service;

import com.projectpulse.projectpulse.exception.ResourceNotFoundException;
import com.projectpulse.projectpulse.project.entity.Project;
import com.projectpulse.projectpulse.project.repository.ProjectRepository;
import com.projectpulse.projectpulse.task.dto.TaskCreateDto;
import com.projectpulse.projectpulse.task.dto.TaskDto;
import com.projectpulse.projectpulse.task.dto.TaskUpdateDto;
import com.projectpulse.projectpulse.task.entity.Task;
import com.projectpulse.projectpulse.task.repository.TaskRepository;
import com.projectpulse.projectpulse.user.entity.User;
import com.projectpulse.projectpulse.user.repository.UserRepository;
import com.projectpulse.projectpulse.util.Mappers;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Transactional
    @CacheEvict(value = "projects", key = "#createDto.projectId", allEntries = false) // Evict project cache when new task is added
    public TaskDto createTask(TaskCreateDto createDto) {
        Project project = projectRepository.findById(createDto.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + createDto.getProjectId()));

        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));

        // Only the project creator or an ADMIN can add tasks to a project
        boolean isAdmin = currentUser.getRole().equals(User.Role.ADMIN);
        if (!Objects.equals(project.getCreatedBy().getId(), currentUser.getId()) && !isAdmin) {
            throw new AccessDeniedException("You are not authorized to add tasks to this project.");
        }

        Task task = Mappers.toTaskEntity(createDto);
        task.setProject(project);

        if (createDto.getAssignedToUserId() != null) {
            User assignedTo = userRepository.findById(createDto.getAssignedToUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found with id: " + createDto.getAssignedToUserId()));
            task.setAssignedTo(assignedTo);
        }

        Task savedTask = taskRepository.save(task);
        return Mappers.toTaskDto(savedTask);
    }

    @Cacheable(value = "tasks", key = "#id")
    @Transactional(readOnly = true)
    public TaskDto getTaskById(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
        return Mappers.toTaskDto(task);
    }

    @Transactional(readOnly = true)
    public List<TaskDto> getTasksByProjectId(Long projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project not found with id: " + projectId);
        }
        return taskRepository.findByProjectId(projectId).stream()
                .map(Mappers::toTaskDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TaskDto> getTasksAssignedToCurrentUser() {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));

        return taskRepository.findByAssignedTo_Id(currentUser.getId()).stream()
                .map(Mappers::toTaskDto)
                .collect(Collectors.toList());
    }

    @CachePut(value = "tasks", key = "#id")
    @CacheEvict(value = "projects", key = "#result.projectId", allEntries = false, condition = "#result != null") // Evict project cache
    @Transactional
    public TaskDto updateTask(Long id, TaskUpdateDto updateDto) {
        Task existingTask = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));

        // Check if the current user is the project creator, assigned to the task, or an ADMIN
        boolean isAdmin = currentUser.getRole().equals(User.Role.ADMIN);
        boolean isProjectCreator = Objects.equals(existingTask.getProject().getCreatedBy().getId(), currentUser.getId());
        boolean isAssignedTo = existingTask.getAssignedTo() != null && Objects.equals(existingTask.getAssignedTo().getId(), currentUser.getId());

        if (!isAdmin && !isProjectCreator && !isAssignedTo) {
            throw new AccessDeniedException("You are not authorized to update this task.");
        }

        Optional.ofNullable(updateDto.getTitle()).ifPresent(existingTask::setTitle);
        Optional.ofNullable(updateDto.getDescription()).ifPresent(existingTask::setDescription);
        Optional.ofNullable(updateDto.getStatus()).ifPresent(existingTask::setStatus);

        if (updateDto.getAssignedToUserId() != null) {
            User assignedTo = userRepository.findById(updateDto.getAssignedToUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found with id: " + updateDto.getAssignedToUserId()));
            existingTask.setAssignedTo(assignedTo);
        } else if (updateDto.getAssignedToUserId() == null && isProjectCreator) {
            // Only project creator can unassign a task
            existingTask.setAssignedTo(null);
        }

        Task updatedTask = taskRepository.save(existingTask);
        return Mappers.toTaskDto(updatedTask);
    }

    @CacheEvict(value = {"tasks", "projects"}, key = "#id", allEntries = false)
    @Transactional
    public void deleteTask(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));

        // Only the project creator or an ADMIN can delete a task
        boolean isAdmin = currentUser.getRole().equals(User.Role.ADMIN);
        boolean isProjectCreator = Objects.equals(task.getProject().getCreatedBy().getId(), currentUser.getId());

        if (!isAdmin && !isProjectCreator) {
            throw new AccessDeniedException("You are not authorized to delete this task.");
        }

        taskRepository.delete(task);
    }
}