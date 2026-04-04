package com.example.secureprojectmanagement.service;

import com.example.secureprojectmanagement.exception.ResourceNotFoundException;
import com.example.secureprojectmanagement.model.Role;
import com.example.secureprojectmanagement.model.User;
import com.example.secureprojectmanagement.repository.RoleRepository;
import com.example.secureprojectmanagement.repository.UserRepository;
import com.example.secureprojectmanagement.web.dto.RegisterRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User registerUser(RegisterRequest registerRequest) {
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new IllegalArgumentException("Username is already taken!");
        }
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new IllegalArgumentException("Email is already in use!");
        }

        User user = new User();
        user.setUsername(registerRequest.getUsername());
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));

        // Assign default role (USER) to new registrations
        Optional<Role> userRole = roleRepository.findByName("ROLE_USER");
        if (userRole.isEmpty()) {
            // Handle case where ROLE_USER might not exist (e.g., initial setup failure)
            throw new ResourceNotFoundException("Default role 'ROLE_USER' not found. Please ensure seed data is correctly loaded.");
        }
        user.setRoles(Collections.singleton(userRole.get()));

        return userRepository.save(user);
    }
}