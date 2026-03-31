package com.authsystem.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * DTO for representing a user's public profile.
 * Contains basic user information suitable for display on a profile page.
 */
@Data
@Schema(description = "DTO for User profile details")
public class UserProfileDTO {
    @Schema(description = "Unique ID of the user", example = "1")
    private Long id;

    @Schema(description = "Username of the user", example = "john_doe")
    private String username;

    @Schema(description = "Email address of the user", example = "john.doe@example.com")
    private String email;

    @Schema(description = "Set of roles assigned to the user", example = "[\"ROLE_USER\"]")
    private Set<String> roles;

    @Schema(description = "Timestamp when the user account was created", example = "2023-10-27T09:00:00")
    private LocalDateTime createdAt;
}