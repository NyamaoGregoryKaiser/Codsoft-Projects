package com.mlutil.controller;

import com.mlutil.auth.AuthService;
import com.mlutil.dto.AuthRequest;
import com.mlutil.dto.AuthResponse;
import com.mlutil.model.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "User authentication and registration API")
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Authenticate user and get JWT token")
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> authenticateUser(@Valid @RequestBody AuthRequest authRequest) {
        AuthResponse response = authService.authenticateUser(authRequest);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Register a new user (with USER role by default)")
    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@Valid @RequestBody AuthRequest authRequest) {
        try {
            authService.registerUser(authRequest, Set.of("ROLE_USER"));
            return new ResponseEntity<>("User registered successfully", HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @Operation(summary = "Register a new admin user (requires existing admin to create)")
    @PostMapping("/register/admin")
    // @PreAuthorize("hasRole('ADMIN')") // Uncomment if you want to restrict this to existing admins
    public ResponseEntity<String> registerAdmin(@Valid @RequestBody AuthRequest authRequest) {
        try {
            authService.registerUser(authRequest, Set.of("ROLE_USER", "ROLE_ADMIN"));
            return new ResponseEntity<>("Admin user registered successfully", HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }
}