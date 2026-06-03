```java
package com.taskflow.project.dto;

import com.taskflow.project.model.Project;
import com.taskflow.user.dto.UserDTO;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDTO {
    private UUID id;

    @NotBlank(message = "Project name cannot be empty")
    @Size(min = 3, max = 255, message = "Project name must be between 3 and 255 characters")
    private String name;

    @Size(max = 1000, message = "Project description cannot exceed 1000 characters")
    private String description;

    private UserDTO owner;
    private Instant createdAt;
    private Instant updatedAt;

    public static ProjectDTO fromEntity(Project project) {
        ProjectDTO dto = new ProjectDTO();
        dto.setId(project.getId());
        dto.setName(project.getName());
        dto.setDescription(project.getDescription());
        if (project.getOwner() != null) {
            dto.setOwner(UserDTO.fromEntity(project.getOwner()));
        }
        dto.setCreatedAt(project.getCreatedAt());
        dto.setUpdatedAt(project.getUpdatedAt());
        return dto;
    }
}
```