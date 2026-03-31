package com.authsystem.dto.auth;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for JWT authentication response.
 * Contains the JWT token, token type, and user details like ID, username, email, and roles.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "Response containing JWT token and user details upon successful authentication")
public class JwtAuthenticationResponse {
    @Schema(description = "JWT access token", example = "eyJhbGciOiJIUzI1NiJ9...")
    private String accessToken;

    @Schema(description = "Type of the token", example = "Bearer")
    private String tokenType = "Bearer";

    @Schema(description = "User ID", example = "1")
    private Long id;

    @Schema(description = "Username", example = "john_doe")
    private String username;

    @Schema(description = "User email", example = "john.doe@example.com")
    private String email;

    @Schema(description = "List of roles assigned to the user", example = "[\"ROLE_USER\", \"ROLE_ADMIN\"]")
    private List<String> roles;
}