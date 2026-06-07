```java
package com.example.authsystem.dto;

import com.example.authsystem.entity.Role;
import com.example.authsystem.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private UUID id;

    @NotBlank(message = "First name cannot be empty")
    private String firstName;

    @NotBlank(message = "Last name cannot be empty")
    private String lastName;

    @NotBlank(message = "Email cannot be empty")
    @Email(message = "Email should be valid")
    private String email;

    // Password is not exposed via DTO for security.
    // When updating, if password needs to change, it should be a separate endpoint or handled carefully.

    @NotNull(message = "Roles cannot be null")
    private Set<String> roles; // Represent roles as strings

    public static UserDto fromEntity(User user) {
        return UserDto.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .roles(user.getRoles().stream()
                        .map(role -> role.getName().name()) // Convert RoleName enum to string
                        .collect(Collectors.toSet()))
                .build();
    }

    public User toEntity() {
        User user = new User();
        user.setId(this.id); // For updates
        user.setFirstName(this.firstName);
        user.setLastName(this.lastName);
        user.setEmail(this.email);
        // Roles and password should be handled by service layer based on logic
        return user;
    }
}
```