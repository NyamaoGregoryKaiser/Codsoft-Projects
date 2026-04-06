package com.cms.system.service;

import com.cms.system.config.JwtUtil;
import com.cms.system.dto.auth.JwtResponse;
import com.cms.system.dto.auth.LoginRequest;
import com.cms.system.dto.user.UserRequest;
import com.cms.system.exception.ApiException;
import com.cms.system.model.Role;
import com.cms.system.model.User;
import com.cms.system.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.cms.system.model.Role.ERole.ROLE_ADMIN;
import static com.cms.system.model.Role.ERole.ROLE_USER;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserService userService; // To leverage role management logic

    public AuthService(AuthenticationManager authenticationManager, JwtUtil jwtUtil,
                       UserRepository userRepository, PasswordEncoder passwordEncoder,
                       UserService userService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.userService = userService;
    }

    // Initialize default admin user if not present
    @PostConstruct
    public void init() {
        if (!userRepository.existsByUsername("admin")) {
            UserRequest adminRequest = new UserRequest();
            adminRequest.setUsername("admin");
            adminRequest.setEmail("admin@cms.com");
            adminRequest.setPassword("adminpass"); // Use a strong password in production
            adminRequest.setRoles(Set.of(ROLE_ADMIN.name(), ROLE_USER.name()));
            try {
                userService.createUser(adminRequest);
                System.out.println("Default admin user created.");
            } catch (ApiException e) {
                System.err.println("Failed to create default admin user: " + e.getMessage());
            }
        }
    }

    public JwtResponse authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtil.generateJwtToken(authentication);

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ApiException("User not found after authentication."));

        return new JwtResponse(jwt, user.getId(), user.getUsername(), user.getEmail(), roles);
    }

    @Transactional
    public User registerUser(UserRequest userRequest) {
        if (userRepository.existsByUsername(userRequest.getUsername())) {
            throw new ApiException("Username is already taken!");
        }
        if (userRepository.existsByEmail(userRequest.getEmail())) {
            throw new ApiException("Email is already in use!");
        }

        User user = new User();
        user.setUsername(userRequest.getUsername());
        user.setEmail(userRequest.getEmail());
        user.setPassword(passwordEncoder.encode(userRequest.getPassword()));
        user.setRoles(userService.getRolesFromStrings(userRequest.getRoles() != null ? userRequest.getRoles() : Collections.singleton(ROLE_USER.name())));
        user.setEnabled(true);
        return userRepository.save(user);
    }
}