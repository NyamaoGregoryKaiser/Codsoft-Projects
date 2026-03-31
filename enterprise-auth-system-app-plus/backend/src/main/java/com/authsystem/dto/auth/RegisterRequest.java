package com.authsystem.dto.auth;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DTO for user registration request.
 * Contains username, email, and password for creating a new user account.
 */
@Data
@Schema(description = "Request DTO for user registration")
public class RegisterRequest {
    @NotBlank(message = "Username must not be empty")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Schema(description = "Unique username for the user", example = "john_doe")
    private String username;

    @NotBlank(message = "Email must not be empty")
    @Email(message = "Email should be valid")
    @Size(max = 100, message = "Email must be less than 100 characters")
    @Schema(description = "Unique email address for the user", example = "john.doe@example.com")
    private String email;

    @NotBlank(message = "Password must not be empty")
    @Size(min = 6, max = 100, message = "Password must be at least 6 characters long")
    @Schema(description = "Password for the user account", example = "password123")
    private String password;
}