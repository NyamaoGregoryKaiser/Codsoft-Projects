package com.authapp.controller;

import com.authapp.dto.LoginRequest;
import com.authapp.dto.LoginResponse;
import com.authapp.dto.RegisterRequest;
import com.authapp.model.User;
import com.authapp.service.AuthService;
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
@Slf4j
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        log.info("Attempting to register user: {}", registerRequest.getUsername());
        authService.registerUser(registerRequest);
        log.info("User registered successfully: {}", registerRequest.getUsername());
        return new ResponseEntity<>("User registered successfully!", HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        log.info("Attempting to authenticate user: {}", loginRequest.getUsername());
        LoginResponse response = authService.authenticateUser(loginRequest);
        log.info("User authenticated successfully: {}", loginRequest.getUsername());
        return ResponseEntity.ok(response);
    }
}