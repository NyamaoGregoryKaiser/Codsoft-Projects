package com.authapp.service;

import com.authapp.dto.LoginRequest;
import com.authapp.dto.LoginResponse;
import com.authapp.dto.RegisterRequest;
import com.authapp.exception.ResourceNotFoundException;
import com.authapp.model.Role;
import com.authapp.model.RoleName;
import com.authapp.model.User;
import com.authapp.repository.RoleRepository;
import com.authapp.repository.UserRepository;
import com.authapp.util.JwtTokenUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenUtil jwtTokenUtil;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User registerUser(RegisterRequest registerRequest) {
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new IllegalArgumentException("Username is already taken!");
        }
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new IllegalArgumentException("Email address already in use!");
        }

        // Creating user's account
        User user = new User(registerRequest.getUsername(),
                registerRequest.getEmail(),
                passwordEncoder.encode(registerRequest.getPassword()));

        // Assign default role (USER)
        Role userRole = roleRepository.findByName(RoleName.ROLE_USER)
                .orElseThrow(() -> new ResourceNotFoundException("User Role not set."));
        user.setRoles(new HashSet<>(Collections.singletonList(userRole)));

        return userRepository.save(user);
    }

    public LoginResponse authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        final User userDetails = (User) authentication.getPrincipal(); // Assuming custom UserDetails returns our User entity
        final String token = jwtTokenUtil.generateToken(userDetails);

        Set<String> roles = new HashSet<>();
        userDetails.getRoles().forEach(role -> roles.add(role.getName().name()));

        return new LoginResponse(token, userDetails.getUsername(), userDetails.getEmail(), roles);
    }
}