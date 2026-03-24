package com.taskmanager.system.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginDto {
    @NotBlank(message = "Username or email is required")
    private String usernameOrEmail;

    @NotBlank(message = "Password is required")
    private String password;
}