package com.etms.backend.service;

import com.etms.backend.dto.TaskDTO;
import com.etms.backend.exception.ResourceNotFoundException;
import com.etms.backend.model.Project;
import com.etms.backend.model.Task;
import com.etms.backend.model.User;
import com.etms.backend.repository.ProjectRepository;
import com.etms.backend.repository.TaskRepository;
import com.etms.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public TaskDTO toTaskDTO(Task task) {
        return TaskDTO.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus())
                .priority(task.getPriority())
                .projectId(task.getProject().getId())
                .assignedToId(task.getAssignedTo() != null ? task.getAssignedTo().getId() : null)
                .assignedToUsername(task.getAssignedTo() != null ? task.getAssignedTo().getUsername() : null)
                .dueDate(task.getDueDate())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }

    @Cacheable(value = "tasks")
    public List<TaskDTO> getAllTasks() {
        return taskRepository.findAll().stream()
                .map(this::toTaskDTO)
                .collect(Collectors.toList());
    }

    @Cacheable(value = "taskById", key = "#id")
    public TaskDTO getTaskById(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
        return toTaskDTO(task);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "tasks", allEntries = true),
            @CacheEvict(value = "taskById", key = "#result.id")
    })
    public TaskDTO createTask(TaskDTO taskDTO) {
        Project project = projectRepository.findById(taskDTO.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + taskDTO.getProjectId()));

        User assignedTo = null;
        if (taskDTO.getAssignedToId() != null) {
            assignedTo = userRepository.findById(taskDTO.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found with id: " + taskDTO.getAssignedToId()));
        }

        Task task = Task.builder()
                .title(taskDTO.getTitle())
                .description(taskDTO.getDescription())
                .status(taskDTO.getStatus())
                .priority(taskDTO.getPriority())
                .project(project)
                .assignedTo(assignedTo)
                .dueDate(taskDTO.getDueDate())
                .build();

        return toTaskDTO(taskRepository.save(task));
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "tasks", allEntries = true),
            @CacheEvict(value = "taskById", key = "#id")
    })
    public TaskDTO updateTask(Long id, TaskDTO taskDTO) {
        Task existingTask = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        Project project = projectRepository.findById(taskDTO.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + taskDTO.getProjectId()));

        User assignedTo = null;
        if (taskDTO.getAssignedToId() != null) {
            assignedTo = userRepository.findById(taskDTO.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found with id: " + taskDTO.getAssignedToId()));
        }

        existingTask.setTitle(taskDTO.getTitle());
        existingTask.setDescription(taskDTO.getDescription());
        existingTask.setStatus(taskDTO.getStatus());
        existingTask.setPriority(taskDTO.getPriority());
        existingTask.setProject(project);
        existingTask.setAssignedTo(assignedTo);
        existingTask.setDueDate(taskDTO.getDueDate());

        return toTaskDTO(taskRepository.save(existingTask));
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "tasks", allEntries = true),
            @CacheEvict(value = "taskById", key = "#id")
    })
    public void deleteTask(Long id) {
        if (!taskRepository.existsById(id)) {
            throw new ResourceNotFoundException("Task not found with id: " + id);
        }
        taskRepository.deleteById(id);
    }
}