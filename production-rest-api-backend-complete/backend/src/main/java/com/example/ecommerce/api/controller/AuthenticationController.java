package com.example.ecommerce.api.controller;

import com.example.ecommerce.api.dto.AuthRequest;
import com.example.ecommerce.api.dto.AuthResponse;
import com.example.ecommerce.api.dto.RegisterRequest;
import com.example.ecommerce.api.service.AuthenticationService;
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

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "User registration and login APIs")
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    @Operation(summary = "Register a new user")
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        return new ResponseEntity<>(authenticationService.register(request), HttpStatus.CREATED);
    }

    @Operation(summary = "Authenticate an existing user")
    @PostMapping("/authenticate")
    public ResponseEntity<AuthResponse> authenticate(
            @Valid @RequestBody AuthRequest request
    ) {
        return ResponseEntity.ok(authenticationService.authenticate(request));
    }
}