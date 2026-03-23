package com.example.chat.service;

import com.example.chat.dto.RegisterRequest;
import com.example.chat.dto.UserDto;
import com.example.chat.entity.User;
import com.example.chat.exception.ValidationException;
import com.example.chat.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
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
    private RegisterRequest registerRequest;

    @BeforeEach
    void setUp() {
        testUser = new User(1L, "testuser", "encodedPassword", "test@example.com", LocalDateTime.now(), LocalDateTime.now(), null);

        registerRequest = new RegisterRequest();
        registerRequest.setUsername("newuser");
        registerRequest.setPassword("newpassword");
        registerRequest.setEmail("newuser@example.com");
    }

    @Test
    @DisplayName("Should successfully register a new user")
    void shouldRegisterNewUserSuccessfully() {
        when(userRepository.existsByUsername(registerRequest.getUsername())).thenReturn(false);
        when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(registerRequest.getPassword())).thenReturn("encodedNewPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        UserDto userDto = userService.registerNewUser(registerRequest);

        assertThat(userDto).isNotNull();
        assertThat(userDto.getUsername()).isEqualTo(testUser.getUsername());
        assertThat(userDto.getEmail()).isEqualTo(testUser.getEmail());
        verify(userRepository, times(1)).save(any(User.class));
        verify(passwordEncoder, times(1)).encode(registerRequest.getPassword());
    }

    @Test
    @DisplayName("Should throw ValidationException when username already exists")
    void shouldThrowExceptionWhenUsernameExists() {
        when(userRepository.existsByUsername(registerRequest.getUsername())).thenReturn(true);

        ValidationException exception = assertThrows(ValidationException.class, () ->
                userService.registerNewUser(registerRequest));

        assertThat(exception.getMessage()).isEqualTo("Username already taken.");
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw ValidationException when email already exists")
    void shouldThrowExceptionWhenEmailExists() {
        when(userRepository.existsByUsername(registerRequest.getUsername())).thenReturn(false);
        when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(true);

        ValidationException exception = assertThrows(ValidationException.class, () ->
                userService.registerNewUser(registerRequest));

        assertThat(exception.getMessage()).isEqualTo("Email already in use.");
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should find user by username")
    void shouldFindByUsername() {
        when(userRepository.findByUsername(testUser.getUsername())).thenReturn(Optional.of(testUser));

        Optional<UserDto> foundUserDto = userService.findByUsername(testUser.getUsername());

        assertThat(foundUserDto).isPresent();
        assertThat(foundUserDto.get().getUsername()).isEqualTo(testUser.getUsername());
    }

    @Test
    @DisplayName("Should return empty optional if user not found by username")
    void shouldReturnEmptyWhenUserNotFoundByUsername() {
        when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        Optional<UserDto> foundUserDto = userService.findByUsername("nonexistent");

        assertThat(foundUserDto).isEmpty();
    }

    @Test
    @DisplayName("Should find user by ID")
    void shouldFindById() {
        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));

        Optional<UserDto> foundUserDto = userService.findById(testUser.getId());

        assertThat(foundUserDto).isPresent();
        assertThat(foundUserDto.get().getId()).isEqualTo(testUser.getId());
    }

    @Test
    @DisplayName("Should return empty optional if user not found by ID")
    void shouldReturnEmptyWhenUserNotFoundById() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        Optional<UserDto> foundUserDto = userService.findById(99L);

        assertThat(foundUserDto).isEmpty();
    }

    @Test
    @DisplayName("Should map User entity to UserDto correctly")
    void shouldMapUserToUserDto() {
        UserDto dto = userService.mapToUserDto(testUser);

        assertThat(dto.getId()).isEqualTo(testUser.getId());
        assertThat(dto.getUsername()).isEqualTo(testUser.getUsername());
        assertThat(dto.getEmail()).isEqualTo(testUser.getEmail());
        assertThat(dto.getCreatedAt()).isEqualTo(testUser.getCreatedAt());
    }

    @Test
    @DisplayName("Should map UserDto to User entity correctly")
    void shouldMapUserDtoToUser() {
        UserDto dto = new UserDto();
        dto.setId(2L);
        dto.setUsername("dtoUser");
        dto.setEmail("dto@example.com");
        dto.setCreatedAt(LocalDateTime.now());

        User entity = userService.mapToUserEntity(dto);

        assertThat(entity.getId()).isEqualTo(dto.getId());
        assertThat(entity.getUsername()).isEqualTo(dto.getUsername());
        assertThat(entity.getEmail()).isEqualTo(dto.getEmail());
        assertThat(entity.getCreatedAt()).isEqualTo(dto.getCreatedAt());
        assertThat(entity.getPassword()).isNull(); // Password should not be mapped back from DTO
        assertThat(entity.getUpdatedAt()).isNull(); // UpdatedAt should not be mapped back from DTO
    }
}