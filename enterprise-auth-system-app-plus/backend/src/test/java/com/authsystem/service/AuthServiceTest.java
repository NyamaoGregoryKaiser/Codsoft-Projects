package com.authsystem.service;

import com.authsystem.dto.auth.LoginRequest;
import com.authsystem.dto.auth.RegisterRequest;
import com.authsystem.dto.auth.JwtAuthenticationResponse;
import com.authsystem.entity.Role;
import com.authsystem.entity.User;
import com.authsystem.exception.InvalidCredentialsException;
import com.authsystem.exception.ResourceAlreadyExistsException;
import com.authsystem.exception.ResourceNotFoundException;
import com.authsystem.repository.RoleRepository;
import com.authsystem.repository.UserRepository;
import com.authsystem.security.CustomUserDetailsService;
import com.authsystem.security.JwtTokenProvider;
import com.authsystem.util.RoleName;
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
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
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
        loginRequest.setUsernameOrEmail("testuser");
        loginRequest.setPassword("password123");

        userRole = new Role();
        userRole.setId(1L);
        userRole.setName(RoleName.ROLE_USER);

        user = new User("testuser", "test@example.com", "encodedPassword");
        user.setId(1L);
        user.setRoles(Collections.singleton(userRole));
    }

    @Test
    @DisplayName("Should register a new user successfully")
    void shouldRegisterUserSuccessfully() {
        // Given
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(roleRepository.findByName(RoleName.ROLE_USER)).thenReturn(Optional.of(userRole));
        when(userRepository.save(any(User.class))).thenReturn(user);

        // When
        authService.registerUser(registerRequest);

        // Then
        verify(userRepository, times(1)).existsByUsername("testuser");
        verify(userRepository, times(1)).existsByEmail("test@example.com");
        verify(passwordEncoder, times(1)).encode("password123");
        verify(roleRepository, times(1)).findByName(RoleName.ROLE_USER);
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw ResourceAlreadyExistsException when username is taken during registration")
    void shouldThrowExceptionWhenUsernameTakenOnRegister() {
        // Given
        when(userRepository.existsByUsername(anyString())).thenReturn(true);

        // When & Then
        ResourceAlreadyExistsException exception = assertThrows(ResourceAlreadyExistsException.class,
                () -> authService.registerUser(registerRequest));
        assertThat(exception.getMessage()).isEqualTo("Username is already taken!");
        verify(userRepository, never()).existsByEmail(anyString());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw ResourceAlreadyExistsException when email is taken during registration")
    void shouldThrowExceptionWhenEmailTakenOnRegister() {
        // Given
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.existsByEmail(anyString())).thenReturn(true);

        // When & Then
        ResourceAlreadyExistsException exception = assertThrows(ResourceAlreadyExistsException.class,
                () -> authService.registerUser(registerRequest));
        assertThat(exception.getMessage()).isEqualTo("Email address already in use!");
        verify(userRepository, times(1)).existsByEmail("test@example.com");
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when ROLE_USER is not found during registration")
    void shouldThrowExceptionWhenRoleUserNotFoundOnRegister() {
        // Given
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(roleRepository.findByName(RoleName.ROLE_USER)).thenReturn(Optional.empty());

        // When & Then
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> authService.registerUser(registerRequest));
        assertThat(exception.getMessage()).isEqualTo("User Role not set. Add default roles to the database.");
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should authenticate user and return JWT successfully")
    void shouldAuthenticateUserSuccessfully() {
        // Given
        Authentication authentication = mock(Authentication.class);
        CustomUserDetailsService.CustomUserDetails userDetails = new CustomUserDetailsService.CustomUserDetails(
                1L, "testuser", "test@example.com", "encodedPassword",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
        );

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(tokenProvider.generateToken(authentication)).thenReturn("mockJwtToken");

        // When
        JwtAuthenticationResponse response = authService.authenticateUser(loginRequest);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("mockJwtToken");
        assertThat(response.getUsername()).isEqualTo("testuser");
        assertThat(response.getRoles()).contains("ROLE_USER");
        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(tokenProvider, times(1)).generateToken(authentication);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isEqualTo(authentication);
    }

    @Test
    @DisplayName("Should throw InvalidCredentialsException when authentication fails")
    void shouldThrowExceptionWhenAuthenticationFails() {
        // Given
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        // When & Then
        InvalidCredentialsException exception = assertThrows(InvalidCredentialsException.class,
                () -> authService.authenticateUser(loginRequest));
        assertThat(exception.getMessage()).isEqualTo("Invalid username/email or password.");
        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(tokenProvider, never()).generateToken(any(Authentication.class));
    }
}
```

#### `backend/src/test/java/com/authsystem/controller/AuthControllerTest.java` (API Test / WebMvc Test)
```java