```java
package com.mlutil.modelmanager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ModelRegisterRequest {
    @NotBlank(message = "Model name cannot be empty")
    @Size(min = 3, max = 100, message = "Model name must be between 3 and 100 characters")
    private String name;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;
}
```