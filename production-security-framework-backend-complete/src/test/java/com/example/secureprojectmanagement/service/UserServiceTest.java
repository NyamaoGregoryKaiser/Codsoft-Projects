package com.example.secureprojectmanagement.service;

import com.example.secureprojectmanagement.exception.ResourceNotFoundException;
import com.example.secureprojectmanagement.model.Role;
import com.example.secureprojectmanagement.model.User;
import com.example.secureprojectmanagement.repository.RoleRepository;
import com.example.secureprojectmanagement.repository.UserRepository;
import com.example.secureprojectmanagement.web.dto.RegisterRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private CustomUserDetailsService customUserDetailsService;

    @InjectMocks
    private AuthService authService;

    private User testUser;
    private Role userRole;

    @BeforeEach
    void setUp() {
        userRole = new Role();
        userRole.setId(2L);
        userRole.setName("ROLE_USER");

        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setPassword("encodedPassword");
        testUser.setEmail("test@example.com");
        testUser.setRoles(Set.of(userRole));
    }

    @Test
    void loadUserByUsername_UserFound_ReturnsUserDetails() {
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.of(testUser));

        UserDetails userDetails = customUserDetailsService.loadUserByUsername("testuser");

        assertNotNull(userDetails);
        assertEquals(testUser.getUsername(), userDetails.getUsername());
        assertEquals(testUser.getPassword(), userDetails.getPassword());
        assertTrue(userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_USER")));
    }

    @Test
    void loadUserByUsername_UserNotFound_ThrowsException() {
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class, () -> customUserDetailsService.loadUserByUsername("nonexistent"));
    }

    @Test
    void loadUserById_UserFound_ReturnsUser() {
        when(userRepository.findById(anyLong())).thenReturn(Optional.of(testUser));

        User foundUser = customUserDetailsService.loadUserById(1L);

        assertNotNull(foundUser);
        assertEquals(testUser.getId(), foundUser.getId());
    }

    @Test
    void loadUserById_UserNotFound_ThrowsException() {
        when(userRepository.findById(anyLong())).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class, () -> customUserDetailsService.loadUserById(99L));
    }

    @Test
    void registerUser_Success_ReturnsNewUser() {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("newuser");
        registerRequest.setEmail("newuser@example.com");
        registerRequest.setPassword("rawPassword");

        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(roleRepository.findByName("ROLE_USER")).thenReturn(Optional.of(userRole));
        when(passwordEncoder.encode(anyString())).thenReturn("encodedNewPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(3L); // Simulate ID generation
            return user;
        });

        User newUser = authService.registerUser(registerRequest);

        assertNotNull(newUser);
        assertEquals("newuser", newUser.getUsername());
        assertEquals("encodedNewPassword", newUser.getPassword());
        assertTrue(newUser.getRoles().contains(userRole));
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void registerUser_UsernameTaken_ThrowsException() {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("testuser"); // Taken
        registerRequest.setEmail("newuser@example.com");
        registerRequest.setPassword("rawPassword");

        when(userRepository.existsByUsername("testuser")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> authService.registerUser(registerRequest));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void registerUser_EmailTaken_ThrowsException() {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("newuser");
        registerRequest.setEmail("test@example.com"); // Taken
        registerRequest.setPassword("rawPassword");

        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> authService.registerUser(registerRequest));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void registerUser_RoleNotFound_ThrowsResourceNotFoundException() {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("newuser");
        registerRequest.setEmail("newuser@example.com");
        registerRequest.setPassword("rawPassword");

        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(roleRepository.findByName("ROLE_USER")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> authService.registerUser(registerRequest));
        verify(userRepository, never()).save(any(User.class));
    }
}