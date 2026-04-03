```java
package com.example.authsystem.auth.service;

import com.example.authsystem.auth.dto.JwtAuthenticationResponse;
import com.example.authsystem.auth.dto.LoginRequest;
import com.example.authsystem.auth.dto.RegisterRequest;
import com.example.authsystem.common.exception.EmailAlreadyExistsException;
import com.example.authsystem.user.model.Role;
import com.example.authsystem.user.model.User;
import com.example.authsystem.user.repository.RoleRepository;
import com.example.authsystem.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for user registration and authentication.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    /**
     * Registers a new user with the default USER role.
     * @param request The registration request containing user details.
     * @return JwtAuthenticationResponse containing the JWT token.
     * @throws EmailAlreadyExistsException If a user with the given email already exists.
     */
    @Transactional
    public JwtAuthenticationResponse register(RegisterRequest request) {
        log.info("Attempting to register new user with email: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Registration failed: Email {} already exists.", request.getEmail());
            throw new EmailAlreadyExistsException("Email already in use: " + request.getEmail());
        }

        Role userRole = roleRepository.findByAuthority(Role.USER.name())
                .orElseThrow(() -> new IllegalStateException("USER role not found. Please ensure roles are seeded."));

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();
        user.addRole(userRole);

        User savedUser = userRepository.save(user);
        log.info("User {} registered successfully with ID: {}", savedUser.getEmail(), savedUser.getId());

        String jwt = jwtService.generateToken(savedUser);
        return JwtAuthenticationResponse.builder()
                .token(jwt)
                .message("User registered successfully")
                .userEmail(savedUser.getEmail())
                .role(userRole.name())
                .build();
    }

    /**
     * Authenticates a user and generates a JWT token.
     * @param request The login request containing user credentials.
     * @return JwtAuthenticationResponse containing the JWT token.
     */
    public JwtAuthenticationResponse login(LoginRequest request) {
        log.info("Attempting to authenticate user: {}", request.getEmail());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = (User) authentication.getPrincipal();
        String jwt = jwtService.generateToken(user);

        log.info("User {} logged in successfully.", user.getEmail());

        // Assuming a user has at least one role and we want to return the first one as primary
        String roleName = user.getAuthorities().stream()
                .findFirst()
                .map(grantedAuthority -> grantedAuthority.getAuthority().replace("ROLE_", ""))
                .orElse("UNKNOWN");

        return JwtAuthenticationResponse.builder()
                .token(jwt)
                .message("Login successful")
                .userEmail(user.getEmail())
                .role(roleName)
                .build();
    }
}
```