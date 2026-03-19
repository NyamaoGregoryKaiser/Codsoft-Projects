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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Unit Tests")
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private JwtTokenUtil jwtTokenUtil;
    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private Authentication authentication; // Mock Spring Security's Authentication

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
    private User user;
    private Role userRole;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest();
        registerRequest.setUsername("testuser");
        registerRequest.setEmail("test@example.com");
        registerRequest.setPassword("password123");

        loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password123");

        userRole = new Role(1L, RoleName.ROLE_USER);
        Set<Role> roles = new HashSet<>(Collections.singletonList(userRole));

        user = new User(1L, "testuser", "test@example.com", "encodedPassword123", null, null);
        user.setRoles(roles);

        // Mock the getPrincipal() method on the Authentication object
        when(authentication.getPrincipal()).thenReturn(user);
    }

    @Test
    void registerUser_Success() {
        when(userRepository.existsByUsername(registerRequest.getUsername())).thenReturn(false);
        when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(registerRequest.getPassword())).thenReturn("encodedPassword123");
        when(roleRepository.findByName(RoleName.ROLE_USER)).thenReturn(Optional.of(userRole));
        when(userRepository.save(any(User.class))).thenReturn(user);

        User registeredUser = authService.registerUser(registerRequest);

        assertNotNull(registeredUser);
        assertEquals(user.getUsername(), registeredUser.getUsername());
        assertEquals(user.getEmail(), registeredUser.getEmail());
        assertTrue(registeredUser.getRoles().contains(userRole));
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void registerUser_UsernameTaken_ThrowsException() {
        when(userRepository.existsByUsername(registerRequest.getUsername())).thenReturn(true);

        Exception exception = assertThrows(IllegalArgumentException.class,
                () -> authService.registerUser(registerRequest));

        assertEquals("Username is already taken!", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void registerUser_EmailTaken_ThrowsException() {
        when(userRepository.existsByUsername(registerRequest.getUsername())).thenReturn(false);
        when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(true);

        Exception exception = assertThrows(IllegalArgumentException.class,
                () -> authService.registerUser(registerRequest));

        assertEquals("Email address already in use!", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void registerUser_RoleNotFound_ThrowsException() {
        when(userRepository.existsByUsername(registerRequest.getUsername())).thenReturn(false);
        when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(registerRequest.getPassword())).thenReturn("encodedPassword123");
        when(roleRepository.findByName(RoleName.ROLE_USER)).thenReturn(Optional.empty());

        Exception exception = assertThrows(ResourceNotFoundException.class,
                () -> authService.registerUser(registerRequest));

        assertEquals("User Role not set.", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void authenticateUser_Success() {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(jwtTokenUtil.generateToken(any(User.class))).thenReturn("mockJwtToken");

        LoginResponse loginResponse = authService.authenticateUser(loginRequest);

        assertNotNull(loginResponse);
        assertEquals("mockJwtToken", loginResponse.getToken());
        assertEquals(user.getUsername(), loginResponse.getUsername());
        assertEquals(user.getEmail(), loginResponse.getEmail());
        assertTrue(loginResponse.getRoles().contains(userRole.getName().name()));
        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(jwtTokenUtil, times(1)).generateToken(any(User.class));
    }

    // AuthenticationManager throws exceptions if credentials are bad,
    // which are handled by the GlobalExceptionHandler.
    // So, AuthService itself doesn't explicitly catch and rethrow bad credential exceptions here.
}
```

**Integration Tests (`src/test/java/com/authapp/repository/UserRepositoryIntegrationTest.java`)**
```java