package com.authsystem.dto.auth;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DTO for user login request.
 * Contains username or email and password for authentication.
 */
@Data
@Schema(description = "Request DTO for user login")
public class LoginRequest {
    @NotBlank(message = "Username or email must not be empty")
    @Schema(description = "Username or email of the user", example = "john_doe")
    private String usernameOrEmail;

    @NotBlank(message = "Password must not be empty")
    @Size(min = 6, message = "Password must be at least 6 characters long")
    @Schema(description = "Password of the user", example = "password123")
    private String password;
}