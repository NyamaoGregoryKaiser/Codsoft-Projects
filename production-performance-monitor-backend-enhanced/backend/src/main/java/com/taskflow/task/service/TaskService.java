```java
package com.taskflow.task.service;

import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.project.model.Project;
import com.taskflow.project.repository.ProjectRepository;
import com.taskflow.task.dto.TaskDTO;
import com.taskflow.task.model.Task;
import com.taskflow.task.repository.TaskRepository;
import com.taskflow.user.model.User;
import com.taskflow.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    @Cacheable(value = "tasks", key = "#id")
    public Task getTaskById(UUID id) {
        log.debug("Fetching task by ID: {}", id);
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + id));
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "tasks", key = "'allTasks'")
    public List<Task> getAllTasks() {
        log.debug("Fetching all tasks.");
        return taskRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Page<Task> getAllTasksPaged(Pageable pageable) {
        log.debug("Fetching all tasks with pagination: {}", pageable);
        return taskRepository.findAll(pageable);
    }

    @Transactional
    @CacheEvict(value = "tasks", allEntries = true) // Clear all task caches on creation
    public Task createTask(TaskDTO taskDTO, UUID projectId, UUID creatorId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + projectId));
        User assignee = null;
        if (taskDTO.getAssignee() != null && taskDTO.getAssignee().getId() != null) {
            assignee = userRepository.findById(taskDTO.getAssignee().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee not found with ID: " + taskDTO.getAssignee().getId()));
        }

        Task task = Task.builder()
                .title(taskDTO.getTitle())
                .description(taskDTO.getDescription())
                .status(taskDTO.getStatus())
                .priority(taskDTO.getPriority())
                .dueDate(taskDTO.getDueDate())
                .project(project)
                .assignee(assignee)
                .build();

        task = taskRepository.save(task);
        log.info("Task created: {} in project {} by user {}", task.getTitle(), project.getName(), creatorId);
        return task;
    }

    @Transactional
    @CacheEvict(value = "tasks", key = "#id") // Evict specific task on update
    public Task updateTask(UUID id, TaskDTO taskDTO) {
        Task existingTask = getTaskById(id);

        existingTask.setTitle(taskDTO.getTitle());
        existingTask.setDescription(taskDTO.getDescription());
        existingTask.setStatus(taskDTO.getStatus());
        existingTask.setPriority(taskDTO.getPriority());
        existingTask.setDueDate(taskDTO.getDueDate());

        if (taskDTO.getAssignee() != null && taskDTO.getAssignee().getId() != null) {
            User assignee = userRepository.findById(taskDTO.getAssignee().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee not found with ID: " + taskDTO.getAssignee().getId()));
            existingTask.setAssignee(assignee);
        } else {
            existingTask.setAssignee(null); // Allow unassigning
        }

        Task updatedTask = taskRepository.save(existingTask);
        log.info("Task updated: {}", updatedTask.getTitle());
        return updatedTask;
    }

    @Transactional
    @CacheEvict(value = "tasks", key = "#id") // Evict specific task on deletion
    public void deleteTask(UUID id) {
        if (!taskRepository.existsById(id)) {
            throw new ResourceNotFoundException("Task not found with ID: " + id);
        }
        taskRepository.deleteById(id);
        log.info("Task deleted with ID: {}", id);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "tasks", key = "'byProject:' + #projectId")
    public List<Task> getTasksByProjectId(UUID projectId) {
        log.debug("Fetching tasks for project ID: {}", projectId);
        return taskRepository.findByProjectId(projectId);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "tasks", key = "'byAssignee:' + #assigneeId")
    public List<Task> getTasksByAssigneeId(UUID assigneeId) {
        log.debug("Fetching tasks for assignee ID: {}", assigneeId);
        return taskRepository.findByAssigneeId(assigneeId);
    }
}
```