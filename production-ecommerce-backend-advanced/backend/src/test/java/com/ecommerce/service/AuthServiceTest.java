package com.ecommerce.service;

import com.ecommerce.config.JwtTokenProvider;
import com.ecommerce.dto.AuthRequest;
import com.ecommerce.dto.JwtResponse;
import com.ecommerce.dto.RegisterRequest;
import com.ecommerce.entity.Cart;
import com.ecommerce.entity.Role;
import com.ecommerce.entity.User;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.CartRepository;
import com.ecommerce.repository.RoleRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.util.AppConstants;
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
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Unit Tests")
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtTokenProvider tokenProvider;
    @Mock
    private CartRepository cartRepository;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;
    private AuthRequest authRequest;
    private User testUser;
    private Role userRole;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest();
        registerRequest.setUsername("testuser");
        registerRequest.setEmail("test@example.com");
        registerRequest.setPassword("password123");
        registerRequest.setFirstName("Test");
        registerRequest.setLastName("User");

        authRequest = new AuthRequest();
        authRequest.setUsername("testuser");
        authRequest.setPassword("password123");

        userRole = new Role(2L, AppConstants.USER);
        Set<Role> roles = Collections.singleton(userRole);

        testUser = User.builder()
                .id(1L)
                .username("testuser")
                .email("test@example.com")
                .password("encodedPassword")
                .firstName("Test")
                .lastName("User")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .roles(roles)
                .build();
    }

    @Test
    void givenRegisterRequest_whenRegisterUser_thenReturnsJwtResponse() {
        // Given
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(roleRepository.findByName(AppConstants.USER)).thenReturn(Optional.of(userRole));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        Authentication authentication = mock(Authentication.class);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        when(authentication.getName()).thenReturn("testuser");
        when(authentication.getAuthorities()).thenReturn(Collections.singleton(new SimpleGrantedAuthority(AppConstants.USER)));
        when(tokenProvider.generateToken(any(Authentication.class))).thenReturn("mockJwtToken");

        // When
        JwtResponse jwtResponse = authService.registerUser(registerRequest);

        // Then
        assertThat(jwtResponse).isNotNull();
        assertThat(jwtResponse.getAccessToken()).isEqualTo("mockJwtToken");
        assertThat(jwtResponse.getUsername()).isEqualTo("testuser");
        assertThat(jwtResponse.getRoles()).containsExactly(AppConstants.USER);
        verify(userRepository, times(1)).save(any(User.class));
        verify(cartRepository, times(1)).save(any(Cart.class)); // Verifies that cart is saved along with user due to cascade
    }

    @Test
    void givenExistingUsername_whenRegisterUser_thenThrowsIllegalArgumentException() {
        // Given
        when(userRepository.existsByUsername(anyString())).thenReturn(true);

        // When & Then
        assertThrows(IllegalArgumentException.class, () -> authService.registerUser(registerRequest));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void givenAuthRequest_whenAuthenticateUser_thenReturnsJwtResponse() {
        // Given
        Authentication authentication = mock(Authentication.class);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        when(authentication.getName()).thenReturn("testuser");
        when(authentication.getAuthorities()).thenReturn(Collections.singleton(new SimpleGrantedAuthority(AppConstants.USER)));

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(tokenProvider.generateToken(any(Authentication.class))).thenReturn("mockJwtToken");

        // When
        JwtResponse jwtResponse = authService.authenticateUser(authRequest);

        // Then
        assertThat(jwtResponse).isNotNull();
        assertThat(jwtResponse.getAccessToken()).isEqualTo("mockJwtToken");
        assertThat(jwtResponse.getUsername()).isEqualTo("testuser");
        assertThat(jwtResponse.getRoles()).containsExactly(AppConstants.USER);
        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    void givenInvalidCredentials_whenAuthenticateUser_thenThrowsAuthenticationException() {
        // Given
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new org.springframework.security.core.AuthenticationException("Invalid credentials") {});

        // When & Then
        assertThrows(org.springframework.security.core.AuthenticationException.class, () -> authService.authenticateUser(authRequest));
    }

    @Test
    void givenUserId_whenGetUserRoles_thenReturnsRoles() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        // When
        Set<Role> roles = authService.getUserRoles(1L);

        // Then
        assertThat(roles).containsExactly(userRole);
        verify(userRepository, times(1)).findById(1L);
    }

    @Test
    void givenInvalidUserId_whenGetUserRoles_thenThrowsResourceNotFoundException() {
        // Given
        when(userRepository.findById(anyLong())).thenReturn(Optional.empty());

        // When & Then
        assertThrows(ResourceNotFoundException.class, () -> authService.getUserRoles(99L));
    }
}