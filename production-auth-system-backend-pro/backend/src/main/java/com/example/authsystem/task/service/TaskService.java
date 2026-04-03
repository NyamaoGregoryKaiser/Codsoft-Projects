```java
package com.example.authsystem.task.service;

import com.example.authsystem.common.exception.ResourceNotFoundException;
import com.example.authsystem.task.dto.TaskDTO;
import com.example.authsystem.task.model.Task;
import com.example.authsystem.task.repository.TaskRepository;
import com.example.authsystem.user.model.User;
import com.example.authsystem.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing user tasks.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    /**
     * Creates a new task for a specific user.
     *
     * @param userId The ID of the user creating the task.
     * @param taskDTO The TaskDTO containing task details.
     * @return The created TaskDTO.
     * @throws ResourceNotFoundException If the user with the given ID is not found.
     */
    @Transactional
    @CacheEvict(value = "userTasks", key = "#userId", allEntries = true) // Clear user's tasks cache
    public TaskDTO createTask(Long userId, TaskDTO taskDTO) {
        log.info("Creating task for user ID: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.warn("User with ID {} not found for task creation.", userId);
                    return new ResourceNotFoundException("User not found with id: " + userId);
                });

        Task task = Task.builder()
                .title(taskDTO.getTitle())
                .description(taskDTO.getDescription())
                .completed(taskDTO.isCompleted())
                .user(user)
                .build();

        Task savedTask = taskRepository.save(task);
        log.info("Task '{}' (ID: {}) created for user ID: {}", savedTask.getTitle(), savedTask.getId(), userId);
        return convertToDTO(savedTask);
    }

    /**
     * Retrieves a task by its ID and ensures it belongs to the specified user.
     *
     * @param taskId The ID of the task.
     * @param userId The ID of the user who owns the task.
     * @return An Optional containing the TaskDTO if found and owned by the user, empty otherwise.
     */
    @Cacheable(value = "tasks", key = "#taskId")
    public Optional<TaskDTO> getTaskByIdAndUserId(Long taskId, Long userId) {
        log.debug("Fetching task ID: {} for user ID: {}", taskId, userId);
        return taskRepository.findByIdAndUserId(taskId, userId)
                .map(this::convertToDTO);
    }

    /**
     * Retrieves all tasks for a specific user.
     *
     * @param userId The ID of the user.
     * @return A list of TaskDTOs belonging to the user.
     */
    @Cacheable(value = "userTasks", key = "#userId")
    public List<TaskDTO> getTasksByUserId(Long userId) {
        log.debug("Fetching all tasks for user ID: {}", userId);
        return taskRepository.findByUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Updates an existing task for a specific user.
     *
     * @param taskId The ID of the task to update.
     * @param userId The ID of the user who owns the task.
     * @param taskDTO The TaskDTO with updated task details.
     * @return The updated TaskDTO.
     * @throws ResourceNotFoundException If the task is not found or does not belong to the user.
     */
    @Transactional
    @CachePut(value = "tasks", key = "#taskId")
    @CacheEvict(value = "userTasks", key = "#userId", allEntries = true) // Clear user's tasks cache
    public TaskDTO updateTask(Long taskId, Long userId, TaskDTO taskDTO) {
        log.info("Updating task ID: {} for user ID: {}", taskId, userId);
        Task task = taskRepository.findByIdAndUserId(taskId, userId)
                .orElseThrow(() -> {
                    log.warn("Task ID: {} not found or not owned by user ID: {} for update.", taskId, userId);
                    return new ResourceNotFoundException("Task not found or unauthorized for id: " + taskId);
                });

        task.setTitle(taskDTO.getTitle());
        task.setDescription(taskDTO.getDescription());
        task.setCompleted(taskDTO.isCompleted());

        Task updatedTask = taskRepository.save(task);
        log.info("Task '{}' (ID: {}) updated for user ID: {}", updatedTask.getTitle(), updatedTask.getId(), userId);
        return convertToDTO(updatedTask);
    }

    /**
     * Deletes a task by its ID, ensuring it belongs to the specified user.
     *
     * @param taskId The ID of the task to delete.
     * @param userId The ID of the user who owns the task.
     * @throws ResourceNotFoundException If the task is not found or does not belong to the user.
     */
    @Transactional
    @CacheEvict(value = {"tasks", "userTasks"}, key = "#taskId", allEntries = true) // Evict specific task and user's task list
    public void deleteTask(Long taskId, Long userId) {
        log.info("Attempting to delete task ID: {} for user ID: {}", taskId, userId);
        if (!taskRepository.existsByIdAndUserId(taskId, userId)) {
            log.warn("Deletion failed: Task ID: {} not found or not owned by user ID: {}.", taskId, userId);
            throw new ResourceNotFoundException("Task not found or unauthorized for id: " + taskId);
        }
        taskRepository.deleteById(taskId);
        log.info("Task ID: {} deleted for user ID: {}", taskId, userId);
    }

    private TaskDTO convertToDTO(Task task) {
        return TaskDTO.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .completed(task.isCompleted())
                .userId(task.getUser().getId())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }
}
```