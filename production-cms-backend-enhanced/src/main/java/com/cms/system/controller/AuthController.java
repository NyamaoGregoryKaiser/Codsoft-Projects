package com.cms.system.controller;

import com.cms.system.dto.auth.JwtResponse;
import com.cms.system.dto.auth.LoginRequest;
import com.cms.system.dto.user.UserRequest;
import com.cms.system.model.User;
import com.cms.system.service.AuthService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Slf4j
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        JwtResponse jwtResponse = authService.authenticateUser(loginRequest);

        // For API clients, return token in body.
        // For browser-based clients, consider storing in a secure HTTP-only cookie.
        ResponseCookie jwtCookie = ResponseCookie.from("jwt", jwtResponse.getToken())
                .path("/")
                .maxAge(24 * 60 * 60) // 24 hours
                .httpOnly(true)
                .secure(true) // Should be true in production (HTTPS)
                .sameSite("Lax") // CSRF protection
                .build();

        log.info("User {} logged in successfully via API.", loginRequest.getUsername());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtCookie.toString())
                .body(jwtResponse);
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody UserRequest userRequest) {
        User registeredUser = authService.registerUser(userRequest);
        log.info("User {} registered successfully.", userRequest.getUsername());
        return new ResponseEntity<>("User registered successfully!", HttpStatus.CREATED);
    }

    @PostMapping("/signout")
    public ResponseEntity<?> logoutUser() {
        ResponseCookie jwtCookie = ResponseCookie.from("jwt", "")
                .path("/")
                .maxAge(0) // Immediately expire
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .build();

        log.info("User logged out.");
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtCookie.toString())
                .body("You've been signed out!");
    }
}