```java
package com.tasksyncpro.tasksyncpro.service;

import com.tasksyncpro.tasksyncpro.dto.TaskDto;
import com.tasksyncpro.tasksyncpro.entity.Project;
import com.tasksyncpro.tasksyncpro.entity.Task;
import com.tasksyncpro.tasksyncpro.entity.User;
import com.tasksyncpro.tasksyncpro.exception.ResourceNotFoundException;
import com.tasksyncpro.tasksyncpro.repository.ProjectRepository;
import com.tasksyncpro.tasksyncpro.repository.TaskRepository;
import com.tasksyncpro.tasksyncpro.repository.UserRepository;
import com.tasksyncpro.tasksyncpro.util.PerformanceMonitorAspect;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final MetricsService metricsService;

    private TaskDto mapToDto(Task task) {
        TaskDto dto = new TaskDto();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setDescription(task.getDescription());
        dto.setStatus(task.getStatus());
        dto.setProjectId(task.getProject().getId());
        dto.setProjectName(task.getProject().getName());
        if (task.getAssignedTo() != null) {
            dto.setAssignedToId(task.getAssignedTo().getId());
            dto.setAssignedToUsername(task.getAssignedTo().getUsername());
        }
        dto.setCreatedAt(task.getCreatedAt());
        dto.setUpdatedAt(task.getUpdatedAt());
        dto.setDueDate(task.getDueDate());
        return dto;
    }

    @Transactional
    @PerformanceMonitorAspect.MonitorPerformance
    public TaskDto createTask(TaskDto taskDto) {
        log.info("Creating new task: {}", taskDto.getTitle());
        Project project = projectRepository.findById(taskDto.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + taskDto.getProjectId()));

        User assignedTo = null;
        if (taskDto.getAssignedToId() != null) {
            assignedTo = userRepository.findById(taskDto.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found with id: " + taskDto.getAssignedToId()));
        }

        Task task = new Task();
        task.setTitle(taskDto.getTitle());
        task.setDescription(taskDto.getDescription());
        task.setStatus(taskDto.getStatus() != null ? taskDto.getStatus() : Task.TaskStatus.TODO);
        task.setProject(project);
        task.setAssignedTo(assignedTo);
        task.setDueDate(taskDto.getDueDate());

        Task savedTask = taskRepository.save(task);
        log.info("Task created with ID: {}", savedTask.getId());
        metricsService.incrementTaskCreatedCounter();
        return mapToDto(savedTask);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "tasks", key = "#id")
    @PerformanceMonitorAspect.MonitorPerformance
    public TaskDto getTaskById(Long id) {
        log.debug("Fetching task by ID: {}", id);
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
        return mapToDto(task);
    }

    @Transactional(readOnly = true)
    @PerformanceMonitorAspect.MonitorPerformance
    public Page<TaskDto> getAllTasks(Pageable pageable) {
        log.debug("Fetching all tasks, page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        return taskRepository.findAll(pageable)
                .map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    @PerformanceMonitorAspect.MonitorPerformance
    public List<TaskDto> getTasksByProjectId(Long projectId) {
        log.debug("Fetching tasks for project ID: {}", projectId);
        return taskRepository.findByProjectId(projectId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    @PerformanceMonitorAspect.MonitorPerformance
    public List<TaskDto> getTasksByAssignedToId(Long assignedToId) {
        log.debug("Fetching tasks assigned to user ID: {}", assignedToId);
        return taskRepository.findByAssignedToId(assignedToId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = "tasks", key = "#id")
    @PerformanceMonitorAspect.MonitorPerformance
    public TaskDto updateTask(Long id, TaskDto taskDto) {
        log.info("Updating task with ID: {}", id);
        Task existingTask = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        existingTask.setTitle(taskDto.getTitle());
        existingTask.setDescription(taskDto.getDescription());
        existingTask.setStatus(taskDto.getStatus());
        existingTask.setDueDate(taskDto.getDueDate());

        if (taskDto.getProjectId() != null && !taskDto.getProjectId().equals(existingTask.getProject().getId())) {
            Project newProject = projectRepository.findById(taskDto.getProjectId())
                    .orElseThrow(() -> new ResourceNotFoundException("New project not found with id: " + taskDto.getProjectId()));
            existingTask.setProject(newProject);
        }

        if (taskDto.getAssignedToId() != null && (existingTask.getAssignedTo() == null || !taskDto.getAssignedToId().equals(existingTask.getAssignedTo().getId()))) {
            User newAssignedTo = userRepository.findById(taskDto.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("New assigned user not found with id: " + taskDto.getAssignedToId()));
            existingTask.setAssignedTo(newAssignedTo);
        } else if (taskDto.getAssignedToId() == null) {
            existingTask.setAssignedTo(null); // Unassign
        }

        Task updatedTask = taskRepository.save(existingTask);
        log.info("Task updated: {}", updatedTask.getTitle());
        return mapToDto(updatedTask);
    }

    @Transactional
    @CacheEvict(value = "tasks", key = "#id")
    @PerformanceMonitorAspect.MonitorPerformance
    public void deleteTask(Long id) {
        log.warn("Deleting task with ID: {}", id);
        if (!taskRepository.existsById(id)) {
            throw new ResourceNotFoundException("Task not found with id: " + id);
        }
        taskRepository.deleteById(id);
        log.info("Task with ID {} deleted.", id);
        metricsService.incrementTaskDeletedCounter(); // Increment a counter for deleted tasks
    }
}
```