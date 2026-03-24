package com.taskmanager.system.controller;

import com.taskmanager.system.dto.auth.JwtAuthResponse;
import com.taskmanager.system.dto.auth.LoginDto;
import com.taskmanager.system.dto.auth.RegisterDto;
import com.taskmanager.system.service.AuthService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@AllArgsConstructor
public class AuthController {

    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<JwtAuthResponse> login(@Valid @RequestBody LoginDto loginDto) {
        JwtAuthResponse response = authService.login(loginDto);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody RegisterDto registerDto) {
        String response = authService.register(registerDto);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}