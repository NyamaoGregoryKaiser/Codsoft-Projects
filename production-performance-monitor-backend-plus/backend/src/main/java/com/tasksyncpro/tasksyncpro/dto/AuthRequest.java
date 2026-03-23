```java
package com.tasksyncpro.tasksyncpro.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AuthRequest {
    @NotBlank(message = "Username or email cannot be empty")
    private String identifier; // Can be username or email

    @NotBlank(message = "Password cannot be empty")
    private String password;
}
```