```java
package com.mlutil.modelmanager.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ModelDto {
    private Long id;
    private String name;
    private String description;
    private String owner;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ModelVersionDto> versions; // Optionally include versions
}
```