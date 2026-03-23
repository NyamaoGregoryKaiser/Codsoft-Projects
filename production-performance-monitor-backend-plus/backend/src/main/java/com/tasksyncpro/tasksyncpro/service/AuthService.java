```java
package com.tasksyncpro.tasksyncpro.service;

import com.tasksyncpro.tasksyncpro.dto.AuthRequest;
import com.tasksyncpro.tasksyncpro.dto.AuthResponse;
import com.tasksyncpro.tasksyncpro.dto.RegisterRequest;
import com.tasksyncpro.tasksyncpro.entity.Role;
import com.tasksyncpro.tasksyncpro.entity.User;
import com.tasksyncpro.tasksyncpro.exception.UnauthorizedException;
import com.tasksyncpro.tasksyncpro.repository.RoleRepository;
import com.tasksyncpro.tasksyncpro.repository.UserRepository;
import com.tasksyncpro.tasksyncpro.security.JwtUtil;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;
    private final MetricsService metricsService; // For custom business metrics

    @PostConstruct
    public void initRolesAndAdmin() {
        if (roleRepository.findByName(Role.RoleName.USER).isEmpty()) {
            roleRepository.save(new Role(Role.RoleName.USER));
            log.info("Role USER created.");
        }
        if (roleRepository.findByName(Role.RoleName.ADMIN).isEmpty()) {
            roleRepository.save(new Role(Role.RoleName.ADMIN));
            log.info("Role ADMIN created.");
        }

        if (userRepository.findByUsername("admin").isEmpty()) {
            User adminUser = new User();
            adminUser.setUsername("admin");
            adminUser.setEmail("admin@tasksycpro.com");
            adminUser.setPassword(passwordEncoder.encode("adminpass"));
            Set<Role> roles = new HashSet<>();
            roleRepository.findByName(Role.RoleName.ADMIN).ifPresent(roles::add);
            roleRepository.findByName(Role.RoleName.USER).ifPresent(roles::add);
            adminUser.setRoles(roles);
            userRepository.save(adminUser);
            log.info("Default admin user created.");
            metricsService.incrementUserRegisteredCounter();
        }
    }

    @Transactional
    public AuthResponse registerUser(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already taken.");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered.");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        
        Role userRole = roleRepository.findByName(Role.RoleName.USER)
                .orElseThrow(() -> new IllegalStateException("USER role not found"));
        user.getRoles().add(userRole);

        userRepository.save(user);
        log.info("User registered: {}", user.getUsername());
        metricsService.incrementUserRegisteredCounter(); // Increment custom metric

        // Authenticate the user immediately after registration
        return authenticateUser(new AuthRequest(request.getUsername(), request.getPassword()));
    }

    @CacheEvict(value = "users", key = "#request.identifier") // Invalidate cache for potentially updated user info
    public AuthResponse authenticateUser(AuthRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getIdentifier(), request.getPassword())
            );
        } catch (BadCredentialsException e) {
            log.warn("Authentication failed for user identifier: {}", request.getIdentifier());
            throw new UnauthorizedException("Invalid username/email or password");
        }

        final UserDetails userDetails = userDetailsService.loadUserByUsername(request.getIdentifier());
        final String jwt = jwtUtil.generateToken(userDetails);

        User user = userRepository.findByUsernameOrEmail(request.getIdentifier(), request.getIdentifier())
                .orElseThrow(() -> new UnauthorizedException("User not found after authentication."));

        String[] roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toSet())
                .toArray(new String[0]);

        log.info("User {} authenticated successfully.", userDetails.getUsername());
        return new AuthResponse(jwt, userDetails.getUsername(), roles);
    }
}
```