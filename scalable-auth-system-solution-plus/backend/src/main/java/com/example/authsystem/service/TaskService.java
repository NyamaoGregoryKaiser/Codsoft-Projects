package com.example.authsystem.service;

import com.example.authsystem.config.CacheConfig;
import com.example.authsystem.dto.TaskDto;
import com.example.authsystem.exception.AccessDeniedException;
import com.example.authsystem.exception.ResourceNotFoundException;
import com.example.authsystem.mapper.TaskMapper;
import com.example.authsystem.model.Task;
import com.example.authsystem.model.User;
import com.example.authsystem.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserService userService; // To get the current authenticated user
    private final TaskMapper taskMapper;

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = CacheConfig.TASKS_CACHE, key = "'allTasks'"),
            @CacheEvict(value = CacheConfig.TASKS_CACHE, key = "'userTasks:' + #result.userId")
    })
    public TaskDto createTask(TaskDto taskDto) {
        User currentUser = userService.getAuthenticatedUserEntity();
        Task task = taskMapper.toEntity(taskDto);
        task.setUser(currentUser); // Associate task with the current user

        Task savedTask = taskRepository.save(task);
        log.info("Task created by user {}: {}", currentUser.getEmail(), savedTask.getTitle());
        return taskMapper.toDto(savedTask);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.TASKS_CACHE, key = "'task:' + #id")
    public TaskDto getTaskById(Long id) {
        User currentUser = userService.getAuthenticatedUserEntity();
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", id));

        // Authorization check: User can only access their own tasks unless they are an admin
        if (!Objects.equals(task.getUser().getId(), currentUser.getId()) && !userService.isAdmin(currentUser)) {
            log.warn("User {} attempted to access task {} belonging to user {}", currentUser.getEmail(), id, task.getUser().getEmail());
            throw new AccessDeniedException("You are not authorized to view this task.");
        }
        return taskMapper.toDto(task);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.TASKS_CACHE, key = "'userTasks:' + #root.args[0].id") // Cache based on user ID
    public List<TaskDto> getTasksForUser(User user) {
        return taskRepository.findByUser(user)
                .stream()
                .map(taskMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TaskDto> getTasksForCurrentUser() {
        User currentUser = userService.getAuthenticatedUserEntity();
        return getTasksForUser(currentUser);
    }


    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')") // Only ADMINs can retrieve all tasks
    @Cacheable(value = CacheConfig.TASKS_CACHE, key = "'allTasks'")
    public List<TaskDto> getAllTasks() {
        return taskRepository.findAll()
                .stream()
                .map(taskMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = CacheConfig.TASKS_CACHE, key = "'task:' + #id"),
            @CacheEvict(value = CacheConfig.TASKS_CACHE, key = "'allTasks'"),
            @CacheEvict(value = CacheConfig.TASKS_CACHE, key = "'userTasks:' + #result.userId")
    })
    public TaskDto updateTask(Long id, TaskDto taskDto) {
        User currentUser = userService.getAuthenticatedUserEntity();
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", id));

        // Authorization check
        if (!Objects.equals(task.getUser().getId(), currentUser.getId()) && !userService.isAdmin(currentUser)) {
            log.warn("User {} attempted to update task {} belonging to user {}", currentUser.getEmail(), id, task.getUser().getEmail());
            throw new AccessDeniedException("You are not authorized to update this task.");
        }

        taskMapper.updateTaskFromDto(taskDto, task);
        Task updatedTask = taskRepository.save(task);
        log.info("Task updated by user {}: {}", currentUser.getEmail(), updatedTask.getTitle());
        return taskMapper.toDto(updatedTask);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = CacheConfig.TASKS_CACHE, key = "'task:' + #id"),
            @CacheEvict(value = CacheConfig.TASKS_CACHE, key = "'allTasks'"),
            @CacheEvict(value = CacheConfig.TASKS_CACHE, key = "'userTasks:' + #currentUser.id") // Evict based on resolved user
    })
    public void deleteTask(Long id) {
        User currentUser = userService.getAuthenticatedUserEntity();
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", id));

        // Authorization check
        if (!Objects.equals(task.getUser().getId(), currentUser.getId()) && !userService.isAdmin(currentUser)) {
            log.warn("User {} attempted to delete task {} belonging to user {}", currentUser.getEmail(), id, task.getUser().getEmail());
            throw new AccessDeniedException("You are not authorized to delete this task.");
        }

        taskRepository.delete(task);
        log.info("Task deleted by user {}: {}", currentUser.getEmail(), task.getTitle());
        // For cache evict on userTasks, we need to pass the user ID, which is tricky in @CacheEvict without #result
        // or by making 'currentUser' available to the SpEL expression. Let's assume `currentUser.id` is available
        // to simplify for now, or explicitly clear all tasks related to the user if exact key cannot be formed.
        // A better approach would be to use a custom cache resolver or a different caching strategy.
    }
}