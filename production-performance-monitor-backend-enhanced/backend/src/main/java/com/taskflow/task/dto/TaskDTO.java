```java
package com.taskflow.task.dto;

import com.taskflow.project.dto.ProjectDTO;
import com.taskflow.task.model.Task;
import com.taskflow.task.model.TaskPriority;
import com.taskflow.task.model.TaskStatus;
import com.taskflow.user.dto.UserDTO;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskDTO {
    private UUID id;

    @NotBlank(message = "Task title cannot be empty")
    @Size(min = 3, max = 255, message = "Task title must be between 3 and 255 characters")
    private String title;

    @Size(max = 1000, message = "Task description cannot exceed 1000 characters")
    private String description;

    @NotNull(message = "Task status cannot be null")
    private TaskStatus status;

    @NotNull(message = "Task priority cannot be null")
    private TaskPriority priority;

    private Instant dueDate;
    private ProjectDTO project; // Only ID and name might be sufficient here
    private UserDTO assignee; // Only ID and username/email might be sufficient here
    private Instant createdAt;
    private Instant updatedAt;

    public static TaskDTO fromEntity(Task task) {
        TaskDTO dto = new TaskDTO();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setDescription(task.getDescription());
        dto.setStatus(task.getStatus());
        dto.setPriority(task.getPriority());
        dto.setDueDate(task.getDueDate());
        if (task.getProject() != null) {
            // Only send basic project info to avoid circular references and over-fetching
            ProjectDTO projectDto = new ProjectDTO();
            projectDto.setId(task.getProject().getId());
            projectDto.setName(task.getProject().getName());
            dto.setProject(projectDto);
        }
        if (task.getAssignee() != null) {
            // Only send basic user info
            UserDTO assigneeDto = new UserDTO();
            assigneeDto.setId(task.getAssignee().getId());
            assigneeDto.setUsername(task.getAssignee().getUsername());
            dto.setAssignee(assigneeDto);
        }
        dto.setCreatedAt(task.getCreatedAt());
        dto.setUpdatedAt(task.getUpdatedAt());
        return dto;
    }
}
```