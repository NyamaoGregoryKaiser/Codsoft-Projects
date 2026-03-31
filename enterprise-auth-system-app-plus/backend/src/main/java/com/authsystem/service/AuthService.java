package com.authsystem.service;

import com.authsystem.dto.auth.JwtAuthenticationResponse;
import com.authsystem.dto.auth.LoginRequest;
import com.authsystem.dto.auth.RegisterRequest;
import com.authsystem.entity.Role;
import com.authsystem.entity.User;
import com.authsystem.exception.InvalidCredentialsException;
import com.authsystem.exception.ResourceAlreadyExistsException;
import com.authsystem.exception.ResourceNotFoundException;
import com.authsystem.repository.RoleRepository;
import com.authsystem.repository.UserRepository;
import com.authsystem.security.CustomUserDetailsService;
import com.authsystem.security.JwtTokenProvider;
import com.authsystem.util.RoleName;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service class for user authentication and registration.
 * Handles business logic for user login, registration, and role assignment.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    /**
     * Registers a new user.
     * Checks for existing username/email, assigns a default USER role, and saves the user.
     *
     * @param registerRequest The request containing user registration details.
     * @throws ResourceAlreadyExistsException If a user with the given username or email already exists.
     * @throws ResourceNotFoundException If the default 'ROLE_USER' is not found in the database.
     */
    @Transactional
    public void registerUser(RegisterRequest registerRequest) {
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new ResourceAlreadyExistsException("Username is already taken!");
        }

        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new ResourceAlreadyExistsException("Email address already in use!");
        }

        User user = new User(registerRequest.getUsername(), registerRequest.getEmail(), registerRequest.getPassword());
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        Role userRole = roleRepository.findByName(RoleName.ROLE_USER)
                .orElseThrow(() -> new ResourceNotFoundException("User Role not set. Add default roles to the database."));

        user.setRoles(Collections.singleton(userRole));
        userRepository.save(user);
        log.info("User registered successfully: {}", user.getUsername());
    }

    /**
     * Authenticates a user and generates a JWT token.
     *
     * @param loginRequest The request containing user login credentials.
     * @return A JwtAuthenticationResponse containing the JWT token and user details.
     * @throws InvalidCredentialsException If authentication fails.
     */
    @Transactional(readOnly = true)
    @CacheEvict(value = "userCache", key = "#loginRequest.usernameOrEmail") // Evict cache on successful login
    public JwtAuthenticationResponse authenticateUser(LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsernameOrEmail(),
                            loginRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Get the CustomUserDetails to extract additional information
            CustomUserDetailsService.CustomUserDetails userDetails =
                    (CustomUserDetailsService.CustomUserDetails) authentication.getPrincipal();

            String jwt = tokenProvider.generateToken(authentication);

            List<String> roles = userDetails.getAuthorities().stream()
                    .map(grantedAuthority -> grantedAuthority.getAuthority())
                    .collect(Collectors.toList());

            log.info("User logged in successfully: {}", userDetails.getUsername());

            return new JwtAuthenticationResponse(jwt, "Bearer", userDetails.getId(), userDetails.getUsername(), userDetails.getEmail(), roles);
        } catch (Exception e) {
            log.error("Authentication failed for user {}: {}", loginRequest.getUsernameOrEmail(), e.getMessage());
            throw new InvalidCredentialsException("Invalid username/email or password.");
        }
    }
}