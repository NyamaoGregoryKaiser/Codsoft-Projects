package com.taskmanager.system.service.impl;

import com.taskmanager.system.dto.auth.JwtAuthResponse;
import com.taskmanager.system.dto.auth.LoginDto;
import com.taskmanager.system.dto.auth.RegisterDto;
import com.taskmanager.system.exception.TaskManagerException;
import com.taskmanager.system.model.Role;
import com.taskmanager.system.model.User;
import com.taskmanager.system.repository.RoleRepository;
import com.taskmanager.system.repository.UserRepository;
import com.taskmanager.system.service.AuthService;
import com.taskmanager.system.util.JwtTokenProvider;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
@AllArgsConstructor
public class AuthServiceImpl implements AuthService {

    private AuthenticationManager authenticationManager;
    private UserRepository userRepository;
    private RoleRepository roleRepository;
    private PasswordEncoder passwordEncoder;
    private JwtTokenProvider jwtTokenProvider;

    @Override
    public JwtAuthResponse login(LoginDto loginDto) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginDto.getUsernameOrEmail(),
                        loginDto.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String token = jwtTokenProvider.generateToken(authentication);

        // Fetch user details to return in response
        User user = userRepository.findByUsername(loginDto.getUsernameOrEmail())
                .orElseGet(() -> userRepository.findByEmail(loginDto.getUsernameOrEmail())
                .orElseThrow(() -> new TaskManagerException(HttpStatus.NOT_FOUND, "User not found")));

        String roleName = user.getRoles().stream().findFirst().orElseThrow(() -> new TaskManagerException(HttpStatus.INTERNAL_SERVER_ERROR, "User has no roles")).getName();

        return new JwtAuthResponse(token, "Bearer", roleName, user.getId(), user.getUsername());
    }

    @Override
    @Transactional
    public String register(RegisterDto registerDto) {
        if (userRepository.existsByUsername(registerDto.getUsername())) {
            throw new TaskManagerException(HttpStatus.BAD_REQUEST, "Username already exists.");
        }
        if (userRepository.existsByEmail(registerDto.getEmail())) {
            throw new TaskManagerException(HttpStatus.BAD_REQUEST, "Email already exists.");
        }

        User user = new User();
        user.setFirstName(registerDto.getFirstName());
        user.setLastName(registerDto.getLastName());
        user.setUsername(registerDto.getUsername());
        user.setEmail(registerDto.getEmail());
        user.setPassword(passwordEncoder.encode(registerDto.getPassword()));

        Set<Role> roles = new HashSet<>();
        Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new TaskManagerException(HttpStatus.INTERNAL_SERVER_ERROR, "User role not found."));
        roles.add(userRole);
        user.setRoles(roles);

        userRepository.save(user);
        return "User registered successfully.";
    }
}