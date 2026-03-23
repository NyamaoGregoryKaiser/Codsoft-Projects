```java
package com.tasksyncpro.tasksyncpro.dto;

import com.tasksyncpro.tasksyncpro.entity.Task;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TaskDto {
    private Long id;
    private String title;
    private String description;
    private Task.TaskStatus status;
    private Long projectId;
    private String projectName;
    private Long assignedToId;
    private String assignedToUsername;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime dueDate;
}
```