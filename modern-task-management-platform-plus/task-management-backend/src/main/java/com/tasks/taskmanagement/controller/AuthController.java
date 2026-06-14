```java
package com.tasks.taskmanagement.controller;

import com.tasks.taskmanagement.dto.AuthRequest;
import com.tasks.taskmanagement.dto.AuthResponse;
import com.tasks.taskmanagement.dto.RegisterRequest;
import com.tasks.taskmanagement.service.AuthService;
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
    public ResponseEntity<AuthResponse> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        log.info("Received registration request for user: {}", registerRequest.getUsername());
        AuthResponse response = authService.registerUser(registerRequest);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> authenticateUser(@Valid @RequestBody AuthRequest authRequest) {
        log.info("Received login request for user/email: {}", authRequest.getUsernameOrEmail());
        AuthResponse response = authService.authenticateUser(authRequest);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
```