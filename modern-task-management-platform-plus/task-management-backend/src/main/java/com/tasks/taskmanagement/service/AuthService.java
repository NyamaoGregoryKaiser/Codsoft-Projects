```java
package com.tasks.taskmanagement.service;

import com.tasks.taskmanagement.dto.AuthRequest;
import com.tasks.taskmanagement.dto.AuthResponse;
import com.tasks.taskmanagement.dto.RegisterRequest;
import com.tasks.taskmanagement.entity.User;
import com.tasks.taskmanagement.entity.User.Role;
import com.tasks.taskmanagement.exception.DuplicateResourceException;
import com.tasks.taskmanagement.exception.InvalidCredentialsException;
import com.tasks.taskmanagement.repository.UserRepository;
import com.tasks.taskmanagement.security.JwtTokenProvider;
import com.tasks.taskmanagement.util.MapperUtil;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;
    private final MapperUtil mapperUtil;

    @Transactional
    public AuthResponse registerUser(RegisterRequest request) {
        log.info("Attempting to register new user: {}", request.getUsername());

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username '" + request.getUsername() + "' is already taken.");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email '" + request.getEmail() + "' is already registered.");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(Role.USER) // Default role for new registrations
                .build();

        User savedUser = userRepository.save(user);
        log.info("User registered successfully: {}", savedUser.getUsername());

        // Immediately authenticate and generate token for registered user
        return authenticateUser(new AuthRequest(request.getUsername(), request.getPassword()));
    }

    public AuthResponse authenticateUser(AuthRequest request) {
        log.info("Attempting to authenticate user: {}", request.getUsernameOrEmail());
        try {
            // Find user by username or email for authentication
            Optional<User> userOptional = userRepository.findByUsernameOrEmail(request.getUsernameOrEmail(), request.getUsernameOrEmail());
            if (userOptional.isEmpty()) {
                throw new InvalidCredentialsException("User not found with username or email: " + request.getUsernameOrEmail());
            }

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            userOptional.get().getUsername(), // Use actual username for Spring Security
                            request.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = tokenProvider.generateToken(authentication);

            User authenticatedUser = (User) authentication.getPrincipal();
            log.info("User authenticated successfully: {}", authenticatedUser.getUsername());

            return new AuthResponse(
                    jwt,
                    "Bearer",
                    authenticatedUser.getId(),
                    authenticatedUser.getUsername(),
                    authenticatedUser.getEmail(),
                    authenticatedUser.getRole().name()
            );

        } catch (AuthenticationException e) {
            log.warn("Authentication failed for user {}: {}", request.getUsernameOrEmail(), e.getMessage());
            throw new InvalidCredentialsException("Invalid username/email or password.");
        }
    }

    public User getCurrentAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            return (User) authentication.getPrincipal();
        }
        throw new InvalidCredentialsException("No authenticated user found.");
    }
}
```