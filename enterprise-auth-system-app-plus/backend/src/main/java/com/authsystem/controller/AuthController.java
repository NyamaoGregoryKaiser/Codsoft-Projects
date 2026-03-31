package com.authsystem.controller;

import com.authsystem.dto.auth.JwtAuthenticationResponse;
import com.authsystem.dto.auth.LoginRequest;
import com.authsystem.dto.auth.RegisterRequest;
import com.authsystem.service.AuthService;
import com.authsystem.util.AppConstants;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.TimeUnit;

/**
 * REST controller for user authentication and registration.
 * Handles login and registration requests, applying rate limiting for security.
 */
@RestController
@RequestMapping(AppConstants.API_BASE + "/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "User login and registration API")
public class AuthController {

    private final AuthService authService;
    @Qualifier(AppConstants.AUTH_RATE_LIMIT_BUCKET)
    private final Bucket authRateLimitBucket; // Injected rate-limiting bucket

    /**
     * Registers a new user with the provided details.
     * Applies rate limiting to prevent abuse.
     *
     * @param registerRequest The request containing user registration details.
     * @return A ResponseEntity with a success message.
     */
    @Operation(summary = "Register a new user",
            responses = {
                    @ApiResponse(responseCode = "201", description = "User registered successfully",
                            content = @Content(mediaType = MediaType.TEXT_PLAIN_VALUE, schema = @Schema(type = "string", example = "User registered successfully!"))),
                    @ApiResponse(responseCode = "400", description = "Invalid input or user already exists"),
                    @ApiResponse(responseCode = "429", description = "Too many requests, please try again later")
            })
    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@Valid @RequestBody RegisterRequest registerRequest, HttpServletResponse response) {
        logRequest(registerRequest.getEmail());
        if (!tryConsumeToken(response)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body("Too many requests. Please try again later.");
        }

        authService.registerUser(registerRequest);
        return new ResponseEntity<>("User registered successfully!", HttpStatus.CREATED);
    }

    /**
     * Authenticates a user and returns a JWT token upon successful login.
     * Applies rate limiting to prevent brute-force attacks.
     *
     * @param loginRequest The request containing user login credentials.
     * @return A ResponseEntity with the JWT authentication response.
     */
    @Operation(summary = "Login a user",
            responses = {
                    @ApiResponse(responseCode = "200", description = "User logged in successfully",
                            content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = JwtAuthenticationResponse.class))),
                    @ApiResponse(responseCode = "401", description = "Invalid credentials"),
                    @ApiResponse(responseCode = "429", description = "Too many requests, please try again later")
            })
    @PostMapping("/login")
    public ResponseEntity<JwtAuthenticationResponse> authenticateUser(@Valid @RequestBody LoginRequest loginRequest, HttpServletResponse response) {
        logRequest(loginRequest.getUsernameOrEmail());
        if (!tryConsumeToken(response)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
        }

        JwtAuthenticationResponse jwtResponse = authService.authenticateUser(loginRequest);
        return ResponseEntity.ok(jwtResponse);
    }

    // Helper method to log requests
    private void logRequest(String identifier) {
        log.info("Incoming auth request for: {}", identifier);
    }

    // Helper method to consume a token from the rate limit bucket
    private boolean tryConsumeToken(HttpServletResponse response) {
        ConsumptionProbe probe = authRateLimitBucket.tryConsumeAndReturnRemaining(1);
        if (probe.isConsumed()) {
            // Add rate limit headers for informational purposes
            response.setHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));
            response.setHeader("X-Rate-Limit-Retry-After-Seconds", "0");
            return true;
        } else {
            // Add rate limit headers when limit is exceeded
            long waitForRefill = TimeUnit.NANOSECONDS.toSeconds(probe.getNanosToWaitForRefill());
            response.setHeader("X-Rate-Limit-Remaining", "0");
            response.setHeader("X-Rate-Limit-Retry-After-Seconds", String.valueOf(waitForRefill));
            log.warn("Rate limit exceeded. Waiting {} seconds for refill.", waitForRefill);
            return false;
        }
    }
}