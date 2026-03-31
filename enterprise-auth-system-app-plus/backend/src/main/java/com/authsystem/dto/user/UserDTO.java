package com.authsystem.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * DTO for representing user details (for administrative purposes).
 * Includes sensitive information like roles and full audit details.
 */
@Data
@Schema(description = "DTO for full User details (e.g., for Admin view)")
public class UserDTO {
    @Schema(description = "Unique ID of the user", example = "1")
    private Long id;

    @Schema(description = "Username of the user", example = "john_doe")
    private String username;

    @Schema(description = "Email address of the user", example = "john.doe@example.com")
    private String email;

    @Schema(description = "Set of roles assigned to the user", example = "[\"ROLE_USER\", \"ROLE_ADMIN\"]")
    private Set<String> roles;

    @Schema(description = "Timestamp when the user account was created", example = "2023-10-27T09:00:00")
    private LocalDateTime createdAt;

    @Schema(description = "Username of the user who created this account", example = "system")
    private String createdBy;

    @Schema(description = "Timestamp when the user account was last updated", example = "2023-10-27T09:00:00")
    private LocalDateTime updatedAt;

    @Schema(description = "Username of the user who last updated this account", example = "system")
    private String updatedBy;
}