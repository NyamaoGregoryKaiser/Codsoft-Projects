package com.example.webscrapingtools.auth.controller;

import com.example.webscrapingtools.auth.dto.AuthRequest;
import com.example.webscrapingtools.auth.dto.AuthResponse;
import com.example.webscrapingtools.auth.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "User authentication and registration APIs")
@Slf4j
public class AuthController {

    private final UserService userService;

    @Operation(summary = "Register a new user", description = "Creates a new user account with default 'USER' role.")
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody AuthRequest request) {
        log.info("Attempting to register user: {}", request.getUsername());
        AuthResponse response = userService.register(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @Operation(summary = "Authenticate user", description = "Authenticates user and returns a JWT token.")
    @PostMapping("/authenticate")
    public ResponseEntity<AuthResponse> authenticate(@Valid @RequestBody AuthRequest request) {
        log.info("Attempting to authenticate user: {}", request.getUsername());
        AuthResponse response = userService.authenticate(request);
        return ResponseEntity.ok(response);
    }
}