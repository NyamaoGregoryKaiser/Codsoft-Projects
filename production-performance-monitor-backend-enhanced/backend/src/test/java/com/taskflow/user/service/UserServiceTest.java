```java
package com.taskflow.user.service;

import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.user.dto.UserRegisterRequest;
import com.taskflow.user.model.User;
import com.taskflow.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private UUID testUserId;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        testUser = User.builder()
                .id(testUserId)
                .username("testuser")
                .email("test@example.com")
                .password("encodedPassword")
                .roles("ROLE_USER")
                .build();
    }

    @Test
    void loadUserByUsername_UserFound_ReturnsUserDetails() {
        when(userRepository.findByUsername(testUser.getUsername())).thenReturn(Optional.of(testUser));

        UserDetails userDetails = userService.loadUserByUsername(testUser.getUsername());

        assertNotNull(userDetails);
        assertEquals(testUser.getUsername(), userDetails.getUsername());
        verify(userRepository, times(1)).findByUsername(testUser.getUsername());
    }

    @Test
    void loadUserByUsername_UserNotFound_ThrowsUsernameNotFoundException() {
        when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class, () -> userService.loadUserByUsername("nonexistent"));
        verify(userRepository, times(1)).findByUsername("nonexistent");
    }

    @Test
    void findByUsername_UserFound_ReturnsOptionalOfUser() {
        when(userRepository.findByUsername(testUser.getUsername())).thenReturn(Optional.of(testUser));

        Optional<User> foundUser = userService.findByUsername(testUser.getUsername());

        assertTrue(foundUser.isPresent());
        assertEquals(testUser.getUsername(), foundUser.get().getUsername());
        verify(userRepository, times(1)).findByUsername(testUser.getUsername());
    }

    @Test
    void findByUsername_UserNotFound_ReturnsEmptyOptional() {
        when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        Optional<User> foundUser = userService.findByUsername("nonexistent");

        assertFalse(foundUser.isPresent());
        verify(userRepository, times(1)).findByUsername("nonexistent");
    }

    @Test
    void registerNewUser_Success_ReturnsRegisteredUser() {
        UserRegisterRequest request = new UserRegisterRequest("newuser", "new@example.com", "password123");
        when(userRepository.existsByUsername(request.getUsername())).thenReturn(false);
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("encodedNewPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User savedUser = invocation.getArgument(0);
            savedUser.setId(UUID.randomUUID()); // Simulate ID generation
            return savedUser;
        });

        User registeredUser = userService.registerNewUser(request);

        assertNotNull(registeredUser);
        assertEquals(request.getUsername(), registeredUser.getUsername());
        assertEquals(request.getEmail(), registeredUser.getEmail());
        assertEquals("encodedNewPassword", registeredUser.getPassword());
        assertEquals("ROLE_USER", registeredUser.getRoles());
        assertNotNull(registeredUser.getId());
        verify(userRepository, times(1)).existsByUsername(request.getUsername());
        verify(userRepository, times(1)).existsByEmail(request.getEmail());
        verify(passwordEncoder, times(1)).encode(request.getPassword());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void registerNewUser_UsernameExists_ThrowsIllegalArgumentException() {
        UserRegisterRequest request = new UserRegisterRequest("testuser", "new@example.com", "password123");
        when(userRepository.existsByUsername(request.getUsername())).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> userService.registerNewUser(request));
        verify(userRepository, times(1)).existsByUsername(request.getUsername());
        verify(userRepository, never()).existsByEmail(anyString());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void registerNewUser_EmailExists_ThrowsIllegalArgumentException() {
        UserRegisterRequest request = new UserRegisterRequest("newuser", "test@example.com", "password123");
        when(userRepository.existsByUsername(request.getUsername())).thenReturn(false);
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> userService.registerNewUser(request));
        verify(userRepository, times(1)).existsByUsername(request.getUsername());
        verify(userRepository, times(1)).existsByEmail(request.getEmail());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void findAllUsers_ReturnsListOfUsers() {
        when(userRepository.findAll()).thenReturn(Collections.singletonList(testUser));

        List<User> users = userService.findAllUsers();

        assertNotNull(users);
        assertEquals(1, users.size());
        assertEquals(testUser.getUsername(), users.get(0).getUsername());
        verify(userRepository, times(1)).findAll();
    }

    @Test
    void findById_UserFound_ReturnsUser() {
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

        User foundUser = userService.findById(testUserId);

        assertNotNull(foundUser);
        assertEquals(testUserId, foundUser.getId());
        verify(userRepository, times(1)).findById(testUserId);
    }

    @Test
    void findById_UserNotFound_ThrowsResourceNotFoundException() {
        UUID nonExistentId = UUID.randomUUID();
        when(userRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> userService.findById(nonExistentId));
        verify(userRepository, times(1)).findById(nonExistentId);
    }
}
```