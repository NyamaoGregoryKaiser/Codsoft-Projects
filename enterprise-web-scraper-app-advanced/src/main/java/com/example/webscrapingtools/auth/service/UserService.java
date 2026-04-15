package com.example.webscrapingtools.auth.service;

import com.example.webscrapingtools.auth.dto.AuthRequest;
import com.example.webscrapingtools.auth.dto.AuthResponse;
import com.example.webscrapingtools.auth.model.Role;
import com.example.webscrapingtools.auth.model.User;
import com.example.webscrapingtools.auth.repository.UserRepository;
import com.example.webscrapingtools.common.error.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(AuthRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("User with this username already exists.");
        }
        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER) // Default role for registration
                .build();
        User savedUser = userRepository.save(user);
        log.info("User registered: {}", savedUser.getUsername());
        String jwtToken = jwtService.generateToken(savedUser);
        return AuthResponse.builder()
                .token(jwtToken)
                .username(savedUser.getUsername())
                .message("Registration successful")
                .build();
    }

    public AuthResponse authenticate(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        log.info("User authenticated: {}", user.getUsername());
        String jwtToken = jwtService.generateToken(user);
        return AuthResponse.builder()
                .token(jwtToken)
                .username(user.getUsername())
                .message("Authentication successful")
                .build();
    }
}