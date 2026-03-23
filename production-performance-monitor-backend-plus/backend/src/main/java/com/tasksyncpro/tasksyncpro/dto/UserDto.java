```java
package com.tasksyncpro.tasksyncpro.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.Set;

@Data
public class UserDto {
    private Long id;
    private String username;
    private String email;
    private Set<String> roles; // Only names
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```