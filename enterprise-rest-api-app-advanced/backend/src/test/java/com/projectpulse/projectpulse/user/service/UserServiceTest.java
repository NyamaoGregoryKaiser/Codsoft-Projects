package com.projectpulse.projectpulse.user.service;

import com.projectpulse.projectpulse.exception.ResourceNotFoundException;
import com.projectpulse.projectpulse.user.dto.UserDto;
import com.projectpulse.projectpulse.user.dto.UserRegisterDto;
import com.projectpulse.projectpulse.user.dto.UserUpdateDto;
import com.projectpulse.projectpulse.user.entity.User;
import com.projectpulse.projectpulse.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
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

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setPassword("encodedPassword"); // Already encoded
        testUser.setRole(User.Role.USER);
        testUser.setCreatedAt(LocalDateTime.now());
        testUser.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    void registerUser_Success() {
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        UserRegisterDto registerDto = new UserRegisterDto();
        registerDto.setUsername("newuser");
        registerDto.setEmail("new@example.com");
        registerDto.setPassword("rawPassword");

        User result = userService.registerUser(registerDto);

        assertNotNull(result);
        assertEquals("newuser", result.getUsername());
        assertEquals("encodedPassword", result.getPassword());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void registerUser_UsernameExists_ThrowsException() {
        when(userRepository.existsByUsername(anyString())).thenReturn(true);

        UserRegisterDto registerDto = new UserRegisterDto();
        registerDto.setUsername("testuser");

        assertThrows(IllegalArgumentException.class, () -> userService.registerUser(registerDto));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void loadUserByUsername_Found_ReturnsUserDetails() {
        when(userRepository.findByUsername(testUser.getUsername())).thenReturn(Optional.of(testUser));

        UserDetails userDetails = userService.loadUserByUsername(testUser.getUsername());

        assertNotNull(userDetails);
        assertEquals(testUser.getUsername(), userDetails.getUsername());
    }

    @Test
    void loadUserByUsername_NotFound_ThrowsException() {
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class, () -> userService.loadUserByUsername("nonexistent"));
    }

    @Test
    void getUserById_Found_ReturnsDto() {
        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));

        UserDto result = userService.getUserById(testUser.getId());

        assertNotNull(result);
        assertEquals(testUser.getUsername(), result.getUsername());
    }

    @Test
    void getUserById_NotFound_ThrowsException() {
        when(userRepository.findById(anyLong())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> userService.getUserById(99L));
    }

    @Test
    void getAllUsers_ReturnsList() {
        when(userRepository.findAll()).thenReturn(List.of(testUser));

        List<UserDto> result = userService.getAllUsers();

        assertNotNull(result);
        assertFalse(result.isEmpty());
        assertEquals(1, result.size());
        assertEquals(testUser.getUsername(), result.get(0).getUsername());
    }

    @Test
    void updateUser_Success() {
        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("newEncodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        UserUpdateDto updateDto = new UserUpdateDto();
        updateDto.setUsername("updateduser");
        updateDto.setEmail("updated@example.com");
        updateDto.setPassword("newPassword");

        UserDto result = userService.updateUser(testUser.getId(), updateDto);

        assertNotNull(result);
        assertEquals("updateduser", result.getUsername());
        assertEquals("updated@example.com", result.getEmail());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void updateUser_UsernameExists_ThrowsException() {
        User otherUser = new User();
        otherUser.setId(2L);
        otherUser.setUsername("existinguser");

        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(userRepository.existsByUsername("existinguser")).thenReturn(true);

        UserUpdateDto updateDto = new UserUpdateDto();
        updateDto.setUsername("existinguser");

        assertThrows(IllegalArgumentException.class, () -> userService.updateUser(testUser.getId(), updateDto));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void deleteUser_Success() {
        when(userRepository.existsById(testUser.getId())).thenReturn(true);
        doNothing().when(userRepository).deleteById(testUser.getId());

        userService.deleteUser(testUser.getId());

        verify(userRepository, times(1)).deleteById(testUser.getId());
    }

    @Test
    void deleteUser_NotFound_ThrowsException() {
        when(userRepository.existsById(anyLong())).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> userService.deleteUser(99L));
        verify(userRepository, never()).deleteById(anyLong());
    }
}
```
**`backend/src/test/java/com/projectpulse/projectpulse/project/controller/ProjectControllerTest.java`**
```java