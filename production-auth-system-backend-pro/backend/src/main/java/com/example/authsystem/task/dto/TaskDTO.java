```java
package com.example.authsystem.task.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * DTO for task data returned to the client or received for creation/update.
 */
@Data
@Builder
public class TaskDTO {
    private Long id;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Completion status is required")
    private boolean completed;

    private Long userId; // For knowing which user this task belongs to

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```