```java
package com.example.authsystem.controller;

import com.example.authsystem.dto.AuthRequest;
import com.example.authsystem.dto.AuthResponse;
import com.example.authsystem.dto.RefreshTokenRequest;
import com.example.authsystem.dto.RegisterRequest;
import com.example.authsystem.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "User registration, login, token refresh endpoints")
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Register a new user", responses = {
            @ApiResponse(responseCode = "200", description = "User registered successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input or user already exists")
    })
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Attempting to register user: {}", request.getEmail());
        AuthResponse response = authService.register(request);
        log.info("User {} registered successfully.", request.getEmail());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Authenticate user and get JWT tokens", responses = {
            @ApiResponse(responseCode = "200", description = "Authentication successful",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid credentials")
    })
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        log.info("Attempting to login user: {}", request.getEmail());
        AuthResponse response = authService.login(request);
        log.info("User {} logged in successfully.", request.getEmail());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Refresh access token using refresh token", responses = {
            @ApiResponse(responseCode = "200", description = "Tokens refreshed successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid or expired refresh token")
    })
    @SecurityRequirement(name = "bearerAuth") // This endpoint requires a refresh token, not an access token for security
    @PostMapping("/refresh-token")
    public ResponseEntity<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        log.info("Attempting to refresh token for user.");
        AuthResponse response = authService.refreshToken(request.getRefreshToken());
        log.info("Tokens refreshed successfully.");
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Logout user (invalidate tokens - not implemented for stateless JWT in this basic version)",
            description = "For stateless JWT, logout typically happens client-side by deleting tokens. " +
                          "A server-side blacklist could be implemented for enhanced security.",
            responses = @ApiResponse(responseCode = "200", description = "Logged out successfully (client-side token removal assumed)")
    )
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/logout")
    public ResponseEntity<String> logout() {
        // In a stateless JWT system, logout is often handled client-side by deleting the token.
        // For server-side invalidation, a token blacklist or revocation mechanism would be needed.
        // This simple implementation acknowledges the request but doesn't perform server-side invalidation.
        log.info("User attempting to logout. (Client-side token removal expected)");
        return ResponseEntity.ok("Logged out successfully.");
    }
}
```