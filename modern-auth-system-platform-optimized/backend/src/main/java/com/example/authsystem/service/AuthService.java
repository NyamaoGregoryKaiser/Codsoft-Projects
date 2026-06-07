```java
package com.example.authsystem.service;

import com.example.authsystem.dto.AuthRequest;
import com.example.authsystem.dto.AuthResponse;
import com.example.authsystem.dto.RegisterRequest;
import com.example.authsystem.entity.Role;
import com.example.authsystem.entity.User;
import com.example.authsystem.exception.CustomExceptions;
import com.example.authsystem.repository.RoleRepository;
import com.example.authsystem.repository.UserRepository;
import com.example.authsystem.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService; // To load user for token refresh

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new CustomExceptions.UserAlreadyExistsException("User with email " + request.getEmail() + " already exists.");
        }

        Role userRole = roleRepository.findByName(Role.RoleName.USER)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Role USER not found. Please ensure it's seeded."));

        User newUser = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .roles(new HashSet<>(Collections.singletonList(userRole)))
                .build();

        userRepository.save(newUser);

        // After successful registration, directly generate tokens
        String accessToken = jwtUtil.generateToken(newUser);
        String refreshToken = jwtUtil.generateRefreshToken(newUser);

        log.info("New user registered successfully: {}", newUser.getEmail());
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    public AuthResponse login(AuthRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
            // If authentication is successful, Spring Security populates the SecurityContext
            User user = (User) authentication.getPrincipal(); // Assuming User entity implements UserDetails

            String accessToken = jwtUtil.generateToken(user);
            String refreshToken = jwtUtil.generateRefreshToken(user);

            log.info("User {} logged in successfully.", user.getEmail());
            return AuthResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .build();
        } catch (BadCredentialsException e) {
            log.warn("Failed login attempt for user {}: Invalid credentials.", request.getEmail());
            throw new CustomExceptions.InvalidCredentialsException("Invalid email or password.");
        }
    }

    public AuthResponse refreshToken(String refreshToken) {
        String userEmail = jwtUtil.extractUsername(refreshToken);
        if (userEmail != null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);
            if (jwtUtil.isTokenValid(refreshToken, userDetails)) {
                // Ensure the user exists and the refresh token is valid
                User user = userRepository.findByEmail(userEmail)
                        .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("User not found for refresh token."));

                // Generate new access and refresh tokens
                String newAccessToken = jwtUtil.generateToken(user);
                String newRefreshToken = jwtUtil.generateRefreshToken(user); // Optionally rotate refresh tokens

                log.info("Tokens refreshed for user: {}", userEmail);
                return AuthResponse.builder()
                        .accessToken(newAccessToken)
                        .refreshToken(newRefreshToken)
                        .build();
            }
        }
        log.warn("Invalid or expired refresh token provided.");
        throw new CustomExceptions.InvalidTokenException("Invalid or expired refresh token.");
    }
}
```