package com.taskmanager.system.service;

import com.taskmanager.system.dto.auth.LoginDto;
import com.taskmanager.system.dto.auth.RegisterDto;
import com.taskmanager.system.exception.TaskManagerException;
import com.taskmanager.system.model.Role;
import com.taskmanager.system.model.User;
import com.taskmanager.system.repository.RoleRepository;
import com.taskmanager.system.repository.UserRepository;
import com.taskmanager.system.service.impl.AuthServiceImpl;
import com.taskmanager.system.util.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
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
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private AuthServiceImpl authService;

    private RegisterDto registerDto;
    private LoginDto loginDto;
    private User user;
    private Role userRole;

    @BeforeEach
    void setUp() {
        registerDto = new RegisterDto();
        registerDto.setFirstName("John");
        registerDto.setLastName("Doe");
        registerDto.setUsername("johndoe");
        registerDto.setEmail("john.doe@example.com");
        registerDto.setPassword("password123");

        loginDto = new LoginDto();
        loginDto.setUsernameOrEmail("johndoe");
        loginDto.setPassword("password123");

        userRole = new Role(1L, "ROLE_USER");
        Set<Role> roles = Collections.singleton(userRole);

        user = new User();
        user.setId(1L);
        user.setFirstName("John");
        user.setLastName("Doe");
        user.setUsername("johndoe");
        user.setEmail("john.doe@example.com");
        user.setPassword("encodedPassword");
        user.setRoles(roles);
    }

    @DisplayName("Test user registration - success")
    @Test
    void testRegisterUser_Success() {
        when(userRepository.existsByUsername(registerDto.getUsername())).thenReturn(false);
        when(userRepository.existsByEmail(registerDto.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(registerDto.getPassword())).thenReturn("encodedPassword");
        when(roleRepository.findByName("ROLE_USER")).thenReturn(Optional.of(userRole));
        when(userRepository.save(any(User.class))).thenReturn(user);

        String result = authService.register(registerDto);

        assertThat(result).isEqualTo("User registered successfully.");
        verify(userRepository, times(1)).save(any(User.class));
    }

    @DisplayName("Test user registration - username already exists")
    @Test
    void testRegisterUser_UsernameExists() {
        when(userRepository.existsByUsername(registerDto.getUsername())).thenReturn(true);

        TaskManagerException exception = assertThrows(TaskManagerException.class, () -> authService.register(registerDto));

        assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(exception.getMessage()).isEqualTo("Username already exists.");
        verify(userRepository, never()).save(any(User.class));
    }

    @DisplayName("Test user login - success")
    @Test
    void testLoginUser_Success() {
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn(user.getUsername());
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        when(jwtTokenProvider.generateToken(authentication)).thenReturn("jwtToken");
        when(userRepository.findByUsername(loginDto.getUsernameOrEmail())).thenReturn(Optional.of(user));

        var response = authService.login(loginDto);

        assertThat(response.getAccessToken()).isEqualTo("jwtToken");
        assertThat(response.getRole()).isEqualTo("ROLE_USER");
        assertThat(response.getUserId()).isEqualTo(user.getId());
        assertThat(response.getUsername()).isEqualTo(user.getUsername());
    }

    @DisplayName("Test user login - invalid credentials")
    @Test
    void testLoginUser_InvalidCredentials() {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new TaskManagerException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        TaskManagerException exception = assertThrows(TaskManagerException.class, () -> authService.login(loginDto));

        assertThat(exception.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}