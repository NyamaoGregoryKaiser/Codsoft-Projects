package com.example.chat.service;

import com.example.chat.dto.RegisterRequest;
import com.example.chat.dto.UserDto;
import com.example.chat.entity.User;
import com.example.chat.exception.ValidationException;
import com.example.chat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    @CacheEvict(value = "users", allEntries = true) // Evict all users cache on new registration
    public UserDto registerNewUser(RegisterRequest request) {
        log.info("Attempting to register new user: {}", request.getUsername());

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ValidationException("Username already taken.");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ValidationException("Email already in use.");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);
        log.info("User registered successfully: {}", savedUser.getUsername());
        return mapToUserDto(savedUser);
    }

    @Cacheable(value = "users", key = "#username")
    public Optional<UserDto> findByUsername(String username) {
        log.debug("Fetching user by username: {}", username);
        return userRepository.findByUsername(username).map(this::mapToUserDto);
    }

    @Cacheable(value = "users", key = "#userId")
    public Optional<UserDto> findById(Long userId) {
        log.debug("Fetching user by ID: {}", userId);
        return userRepository.findById(userId).map(this::mapToUserDto);
    }

    public User mapToUserEntity(UserDto dto) {
        User user = new User();
        user.setId(dto.getId());
        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
        user.setCreatedAt(dto.getCreatedAt());
        // Password and updatedAt are not typically mapped back from DTO for security/simplicity
        return user;
    }

    public UserDto mapToUserDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }
}