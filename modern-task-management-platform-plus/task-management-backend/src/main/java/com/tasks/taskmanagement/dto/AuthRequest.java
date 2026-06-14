```java
package com.tasks.taskmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthRequest {
    @NotBlank(message = "Username or email is required")
    private String usernameOrEmail; // Can be either username or email

    @NotBlank(message = "Password is required")
    private String password;
}
```