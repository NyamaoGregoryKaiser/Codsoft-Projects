```java
package com.scrapify.webscraper.controller;

import com.scrapify.webscraper.dto.AuthRequest;
import com.scrapify.webscraper.dto.AuthResponse;
import com.scrapify.webscraper.dto.UserRegistrationRequest;
import com.scrapify.webscraper.dto.UserResponse;
import com.scrapify.webscraper.exception.UserAlreadyExistsException;
import com.scrapify.webscraper.service.CustomUserDetailsService;
import com.scrapify.webscraper.service.UserService;
import com.scrapify.webscraper.config.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "User authentication and registration APIs")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;
    private final UserService userService;

    @Operation(summary = "Authenticate user and get JWT token")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Authentication successful",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid credentials"),
            @ApiResponse(responseCode = "400", description = "Invalid request payload")
    })
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> createAuthenticationToken(@Valid @RequestBody AuthRequest authRequest) {
        log.info("Attempting to authenticate user: {}", authRequest.getUsername());
        try {
            Authentication authenticate = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(authRequest.getUsername(), authRequest.getPassword())
            );
            // If authentication is successful, generate JWT
            final UserDetails userDetails = (UserDetails) authenticate.getPrincipal();
            final String jwt = jwtUtil.generateToken(userDetails);
            log.info("User {} authenticated successfully.", authRequest.getUsername());
            return ResponseEntity.ok(new AuthResponse(jwt));
        } catch (BadCredentialsException e) {
            log.warn("Authentication failed for user {}: Invalid credentials", authRequest.getUsername());
            throw new BadCredentialsException("Incorrect username or password", e);
        }
    }

    @Operation(summary = "Register a new user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "User registered successfully",
                    content = @Content(schema = @Schema(implementation = UserResponse.class))),
            @ApiResponse(responseCode = "409", description = "Username or email already exists"),
            @ApiResponse(responseCode = "400", description = "Invalid registration data")
    })
    @PostMapping("/register")
    public ResponseEntity<UserResponse> registerUser(@Valid @RequestBody UserRegistrationRequest request) {
        log.info("Attempting to register new user: {}", request.getUsername());
        try {
            UserResponse userResponse = userService.registerNewUser(request);
            log.info("User {} registered successfully.", request.getUsername());
            return new ResponseEntity<>(userResponse, HttpStatus.CREATED);
        } catch (UserAlreadyExistsException e) {
            log.warn("User registration failed for {}: {}", request.getUsername(), e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(null); // Or return a custom error DTO
        }
    }
}
```