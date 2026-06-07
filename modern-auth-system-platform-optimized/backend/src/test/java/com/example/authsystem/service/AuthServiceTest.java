```java
package com.example.authsystem.service;

import com.example.authsystem.dto.AuthRequest;
import com.example.authsystem.dto.AuthResponse;
import com.example.authsystem.dto.RegisterRequest;
import com.example.authsystem.entity.Role;
import com.example.authsystem.entity.User;
import com.example.authsystem.exception.CustomExceptions;
import com.example.authsystem.repository.RoleRepository;
import com.example.authsystem.repository.UserRepository;
import com.example.authsystem.util.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtUtil jwtUtil;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private CustomUserDetailsService userDetailsService;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;
    private AuthRequest authRequest;
    private User user;
    private Role userRole;

    @BeforeEach
    void setUp() {
        registerRequest = RegisterRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@example.com")
                .password("password123")
                .build();

        authRequest = AuthRequest.builder()
                .email("john.doe@example.com")
                .password("password123")
                .build();

        userRole = Role.builder().id(UUID.randomUUID()).name(Role.RoleName.USER).build();
        user = User.builder()
                .id(UUID.randomUUID())
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@example.com")
                .password("encodedPassword")
                .roles(Set.of(userRole))
                .build();
    }

    @Test
    @DisplayName("Should register a new user successfully")
    void register_Success() {
        when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(false);
        when(roleRepository.findByName(Role.RoleName.USER)).thenReturn(Optional.of(userRole));
        when(passwordEncoder.encode(registerRequest.getPassword())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(jwtUtil.generateToken(any(User.class))).thenReturn("mockAccessToken");
        when(jwtUtil.generateRefreshToken(any(User.class))).thenReturn("mockRefreshToken");

        AuthResponse response = authService.register(registerRequest);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("mockAccessToken");
        assertThat(response.getRefreshToken()).isEqualTo("mockRefreshToken");
        verify(userRepository, times(1)).existsByEmail(registerRequest.getEmail());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw UserAlreadyExistsException if email already exists during registration")
    void register_UserAlreadyExists() {
        when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(true);

        assertThrows(CustomExceptions.UserAlreadyExistsException.class, () -> authService.register(registerRequest));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should log in a user successfully")
    void login_Success() {
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(user);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        when(jwtUtil.generateToken(any(User.class))).thenReturn("mockAccessToken");
        when(jwtUtil.generateRefreshToken(any(User.class))).thenReturn("mockRefreshToken");

        AuthResponse response = authService.login(authRequest);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("mockAccessToken");
        assertThat(response.getRefreshToken()).isEqualTo("mockRefreshToken");
        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    @DisplayName("Should throw InvalidCredentialsException for bad credentials during login")
    void login_BadCredentials() {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Invalid credentials"));

        assertThrows(CustomExceptions.InvalidCredentialsException.class, () -> authService.login(authRequest));
        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(jwtUtil, never()).generateToken(any(User.class));
    }

    @Test
    @DisplayName("Should refresh token successfully")
    void refreshToken_Success() {
        String oldRefreshToken = "oldRefreshToken";
        String newAccessToken = "newAccessToken";
        String newRefreshToken = "newRefreshToken";

        when(jwtUtil.extractUsername(oldRefreshToken)).thenReturn(user.getEmail());
        when(userDetailsService.loadUserByUsername(user.getEmail())).thenReturn(user);
        when(jwtUtil.isTokenValid(oldRefreshToken, user)).thenReturn(true);
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(jwtUtil.generateToken(user)).thenReturn(newAccessToken);
        when(jwtUtil.generateRefreshToken(user)).thenReturn(newRefreshToken);

        AuthResponse response = authService.refreshToken(oldRefreshToken);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo(newAccessToken);
        assertThat(response.getRefreshToken()).isEqualTo(newRefreshToken);
        verify(jwtUtil, times(1)).isTokenValid(oldRefreshToken, user);
        verify(jwtUtil, times(1)).generateToken(user);
        verify(jwtUtil, times(1)).generateRefreshToken(user);
    }

    @Test
    @DisplayName("Should throw InvalidTokenException if refresh token is invalid")
    void refreshToken_InvalidToken() {
        String invalidRefreshToken = "invalidToken";
        when(jwtUtil.extractUsername(invalidRefreshToken)).thenReturn(user.getEmail());
        when(userDetailsService.loadUserByUsername(user.getEmail())).thenReturn(user);
        when(jwtUtil.isTokenValid(invalidRefreshToken, user)).thenReturn(false);

        assertThrows(CustomExceptions.InvalidTokenException.class, () -> authService.refreshToken(invalidRefreshToken));
        verify(jwtUtil, times(1)).isTokenValid(invalidRefreshToken, user);
        verify(jwtUtil, never()).generateToken(any(User.class));
    }

    @Test
    @DisplayName("Should throw InvalidTokenException if user not found for refresh token")
    void refreshToken_UserNotFound() {
        String refreshToken = "refreshToken";
        when(jwtUtil.extractUsername(refreshToken)).thenReturn("nonexistent@example.com");
        when(userDetailsService.loadUserByUsername("nonexistent@example.com")).thenReturn(user); // Mocking loadUserByUsername for valid token but user not in repo
        when(jwtUtil.isTokenValid(refreshToken, user)).thenReturn(true);
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        assertThrows(CustomExceptions.ResourceNotFoundException.class, () -> authService.refreshToken(refreshToken));
        verify(userRepository, times(1)).findByEmail("nonexistent@example.com");
    }
}
```