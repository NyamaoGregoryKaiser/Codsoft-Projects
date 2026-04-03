```java
package com.example.authsystem.auth.controller;

import com.example.authsystem.auth.dto.JwtAuthenticationResponse;
import com.example.authsystem.auth.dto.LoginRequest;
import com.example.authsystem.auth.dto.RegisterRequest;
import com.example.authsystem.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for user authentication and registration.
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    /**
     * Registers a new user.
     *
     * @param request The registration request details.
     * @return ResponseEntity containing JWT authentication response.
     */
    @PostMapping("/register")
    public ResponseEntity<JwtAuthenticationResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Received registration request for email: {}", request.getEmail());
        JwtAuthenticationResponse response = authService.register(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Authenticates an existing user.
     *
     * @param request The login request credentials.
     * @return ResponseEntity containing JWT authentication response.
     */
    @PostMapping("/login")
    public ResponseEntity<JwtAuthenticationResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Received login request for email: {}", request.getEmail());
        JwtAuthenticationResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }
}
```