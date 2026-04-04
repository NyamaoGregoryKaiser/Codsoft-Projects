package com.example.secureprojectmanagement.service;

import com.example.secureprojectmanagement.exception.ResourceNotFoundException;
import com.example.secureprojectmanagement.model.Project;
import com.example.secureprojectmanagement.model.Task;
import com.example.secureprojectmanagement.model.User;
import com.example.secureprojectmanagement.repository.ProjectRepository;
import com.example.secureprojectmanagement.repository.TaskRepository;
import com.example.secureprojectmanagement.web.dto.TaskDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final CustomUserDetailsService userDetailsService;

    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('ADMIN', 'USER') and @projectService.isProjectOwner(#projectId, authentication.principal.id)")
    public List<Task> getTasksByProjectId(Long projectId) {
        return taskRepository.findByProjectId(projectId);
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('ADMIN', 'USER') and (@projectService.isProjectOwner(#projectId, authentication.principal.id) or @taskService.isTaskAssignee(#taskId, authentication.principal.id))")
    @Cacheable(value = "tasks", key = "#taskId")
    public Task getTaskById(Long projectId, Long taskId) {
        return taskRepository.findById(taskId)
                .filter(task -> task.getProject().getId().equals(projectId))
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId + " in project: " + projectId));
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN', 'USER') and @projectService.isProjectOwner(#projectId, authentication.principal.id)")
    @CacheEvict(value = "tasks", allEntries = true) // Evict all tasks from cache on creation (simpler, can be optimized)
    public Task createTask(Long projectId, TaskDTO taskDTO, Long creatorId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        Task task = new Task();
        task.setProject(project);
        task.setTitle(taskDTO.getTitle());
        task.setDescription(taskDTO.getDescription());
        task.setStatus(taskDTO.getStatus());
        task.setPriority(taskDTO.getPriority());
        task.setDueDate(taskDTO.getDueDate());
        if (taskDTO.getAssignedToId() != null) {
            User assignedTo = userDetailsService.loadUserById(taskDTO.getAssignedToId());
            task.setAssignedTo(assignedTo);
        }
        return taskRepository.save(task);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN', 'USER') and (@projectService.isProjectOwner(#projectId, authentication.principal.id) or @taskService.isTaskAssignee(#taskId, authentication.principal.id))")
    @CachePut(value = "tasks", key = "#taskId") // Update specific task in cache
    public Task updateTask(Long projectId, Long taskId, TaskDTO taskDTO) {
        Task task = taskRepository.findById(taskId)
                .filter(t -> t.getProject().getId().equals(projectId))
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId + " in project: " + projectId));

        task.setTitle(taskDTO.getTitle());
        task.setDescription(taskDTO.getDescription());
        task.setStatus(taskDTO.getStatus());
        task.setPriority(taskDTO.getPriority());
        task.setDueDate(taskDTO.getDueDate());
        if (taskDTO.getAssignedToId() != null) {
            User assignedTo = userDetailsService.loadUserById(taskDTO.getAssignedToId());
            task.setAssignedTo(assignedTo);
        } else {
            task.setAssignedTo(null);
        }
        return taskRepository.save(task);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN') or @projectService.isProjectOwner(#projectId, authentication.principal.id)")
    @CacheEvict(value = "tasks", key = "#taskId") // Evict specific task from cache
    public void deleteTask(Long projectId, Long taskId) {
        Task task = taskRepository.findById(taskId)
                .filter(t -> t.getProject().getId().equals(projectId))
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId + " in project: " + projectId));
        taskRepository.delete(task);
    }

    // Helper method for authorization (used in @PreAuthorize)
    public boolean isTaskAssignee(Long taskId, Long userId) {
        return taskRepository.findById(taskId)
                .map(task -> task.getAssignedTo() != null && task.getAssignedTo().getId().equals(userId))
                .orElse(false);
    }
}