```java
package com.example.authsystem.auth.service;

import com.example.authsystem.auth.dto.LoginRequest;
import com.example.authsystem.auth.dto.RegisterRequest;
import com.example.authsystem.common.exception.EmailAlreadyExistsException;
import com.example.authsystem.user.model.Role;
import com.example.authsystem.user.model.User;
import com.example.authsystem.user.repository.RoleRepository;
import com.example.authsystem.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
    private User testUser;
    private Role userRole;

    @BeforeEach
    void setUp() {
        registerRequest = RegisterRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@example.com")
                .password("password123")
                .build();

        loginRequest = LoginRequest.builder()
                .email("john.doe@example.com")
                .password("password123")
                .build();

        userRole = new Role("USER");
        Set<Role> roles = new HashSet<>(Collections.singletonList(userRole));

        testUser = User.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@example.com")
                .password("encodedPassword")
                .roles(roles)
                .build();
    }

    @Test
    @DisplayName("Should register a new user successfully")
    void register_Success() {
        when(userRepository.existsByEmail(any(String.class))).thenReturn(false);
        when(roleRepository.findByAuthority(Role.USER.name())).thenReturn(Optional.of(userRole));
        when(passwordEncoder.encode(any(String.class))).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(jwtService.generateToken(any(User.class))).thenReturn("jwtToken");

        var response = authService.register(registerRequest);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("jwtToken");
        assertThat(response.getUserEmail()).isEqualTo(testUser.getEmail());
        assertThat(response.getMessage()).isEqualTo("User registered successfully");
        assertThat(response.getRole()).isEqualTo(userRole.name());
    }

    @Test
    @DisplayName("Should throw EmailAlreadyExistsException if email already in use during registration")
    void register_EmailAlreadyExists_ThrowsException() {
        when(userRepository.existsByEmail(any(String.class))).thenReturn(true);

        assertThrows(EmailAlreadyExistsException.class, () -> authService.register(registerRequest));
    }

    @Test
    @DisplayName("Should login a user successfully and return JWT token")
    void login_Success() {
        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(testUser, loginRequest.getPassword(), testUser.getAuthorities());
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authToken);
        when(jwtService.generateToken(any(User.class))).thenReturn("jwtToken");

        var response = authService.login(loginRequest);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("jwtToken");
        assertThat(response.getUserEmail()).isEqualTo(testUser.getEmail());
        assertThat(response.getMessage()).isEqualTo("Login successful");
        assertThat(response.getRole()).isEqualTo(userRole.name());
    }
}
```