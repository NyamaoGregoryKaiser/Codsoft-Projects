package com.projectpulse.projectpulse.auth;

import com.projectpulse.projectpulse.auth.dto.AuthRequest;
import com.projectpulse.projectpulse.auth.dto.AuthResponse;
import com.projectpulse.projectpulse.auth.jwt.JwtService;
import com.projectpulse.projectpulse.exception.UnauthorizedException;
import com.projectpulse.projectpulse.user.dto.UserRegisterDto;
import com.projectpulse.projectpulse.user.entity.User;
import com.projectpulse.projectpulse.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "User authentication and registration APIs")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserService userService;

    @Operation(summary = "Register a new user")
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> registerUser(@Valid @RequestBody UserRegisterDto registerDto) {
        User registeredUser = userService.registerUser(registerDto);
        UserDetails userDetails = userService.loadUserByUsername(registeredUser.getUsername());
        String jwtToken = jwtService.generateToken(userDetails);

        AuthResponse authResponse = AuthResponse.builder()
                .token(jwtToken)
                .username(registeredUser.getUsername())
                .role(registeredUser.getRole().name())
                .build();

        return new ResponseEntity<>(authResponse, HttpStatus.CREATED);
    }

    @Operation(summary = "Authenticate user and get JWT token")
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> loginUser(@Valid @RequestBody AuthRequest authRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(authRequest.getUsername(), authRequest.getPassword())
            );
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String jwtToken = jwtService.generateToken(userDetails);

            User user = userService.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new UnauthorizedException("User not found after authentication"));

            AuthResponse authResponse = AuthResponse.builder()
                    .token(jwtToken)
                    .username(user.getUsername())
                    .role(user.getRole().name())
                    .build();

            return ResponseEntity.ok(authResponse);
        } catch (BadCredentialsException ex) {
            throw new UnauthorizedException("Invalid username or password.");
        }
    }
}