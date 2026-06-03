```java
package com.taskflow.auth;

import com.taskflow.auth.dto.LoginRequest;
import com.taskflow.auth.dto.LoginResponse;
import com.taskflow.config.JwtUtil;
import com.taskflow.exception.UnauthorizedException;
import com.taskflow.user.dto.UserRegisterRequest;
import com.taskflow.user.model.User;
import com.taskflow.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "User login and registration API")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserService userService;

    @Operation(summary = "Authenticate user and get JWT token",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Successful authentication"),
                    @ApiResponse(responseCode = "401", description = "Invalid credentials")
            })
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String jwt = jwtUtil.generateToken(userDetails);

            User user = userService.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new UnauthorizedException("User not found after authentication."));

            log.info("User '{}' logged in successfully.", user.getUsername());

            return ResponseEntity.ok(new LoginResponse(
                    user.getId(),
                    user.getUsername(),
                    user.getEmail(),
                    jwt,
                    userDetails.getAuthorities().stream().map(Object::toString).collect(Collectors.toList())
            ));
        } catch (BadCredentialsException e) {
            log.warn("Failed login attempt for user '{}'. Invalid credentials.", loginRequest.getUsername());
            throw new UnauthorizedException("Invalid username or password.");
        }
    }

    @Operation(summary = "Register a new user",
            responses = {
                    @ApiResponse(responseCode = "201", description = "User registered successfully"),
                    @ApiResponse(responseCode = "400", description = "Invalid input or username/email already exists")
            })
    @PostMapping("/register")
    public ResponseEntity<User> registerUser(@Valid @RequestBody UserRegisterRequest registerRequest) {
        User registeredUser = userService.registerNewUser(registerRequest);
        log.info("User '{}' registered successfully.", registeredUser.getUsername());
        return new ResponseEntity<>(registeredUser, HttpStatus.CREATED);
    }
}
```