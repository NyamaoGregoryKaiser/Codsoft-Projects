package com.authapp.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateRequest {
    @Size(max = 50, message = "Email must be less than 50 characters")
    @Email(message = "Email must be a valid email address")
    private String email;

    @Size(min = 6, max = 40, message = "Password must be between 6 and 40 characters")
    private String password;
}