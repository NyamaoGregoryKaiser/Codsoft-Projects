```java
package com.mlutil.modelmanager.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ModelVersionDto {
    private Long id;
    private Long modelId;
    private Integer versionNumber;
    private String modelPath; // Simplified
    private String fileName;
    private String fileType;
    private String status;
    private String metadata;
    private LocalDateTime uploadedAt;
    private Boolean isActive;
}
```