```java
package com.tasksyncpro.tasksyncpro.service;

import com.tasksyncpro.tasksyncpro.dto.UserDto;
import com.tasksyncpro.tasksyncpro.entity.User;
import com.tasksyncpro.tasksyncpro.exception.ResourceNotFoundException;
import com.tasksyncpro.tasksyncpro.repository.UserRepository;
import com.tasksyncpro.tasksyncpro.util.PerformanceMonitorAspect;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Helper to map entity to DTO
    private UserDto mapToDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        dto.setRoles(user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toSet()));
        return dto;
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "users", key = "#id")
    @PerformanceMonitorAspect.MonitorPerformance
    public UserDto getUserById(Long id) {
        log.debug("Fetching user by ID: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return mapToDto(user);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "users", key = "#username")
    @PerformanceMonitorAspect.MonitorPerformance
    public UserDto getUserByUsername(String username) {
        log.debug("Fetching user by username: {}", username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
        return mapToDto(user);
    }

    @Transactional(readOnly = true)
    @PerformanceMonitorAspect.MonitorPerformance
    public Page<UserDto> getAllUsers(Pageable pageable) {
        log.debug("Fetching all users, page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        return userRepository.findAll(pageable)
                .map(this::mapToDto);
    }

    @Transactional
    @CacheEvict(value = "users", key = "#id") // Evict cache when user is updated
    @PerformanceMonitorAspect.MonitorPerformance
    public UserDto updateUser(Long id, UserDto userDto) {
        log.info("Updating user with ID: {}", id);
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (userDto.getUsername() != null && !userDto.getUsername().equals(existingUser.getUsername())) {
            if (userRepository.existsByUsername(userDto.getUsername())) {
                throw new IllegalArgumentException("Username already taken.");
            }
            existingUser.setUsername(userDto.getUsername());
        }
        if (userDto.getEmail() != null && !userDto.getEmail().equals(existingUser.getEmail())) {
            if (userRepository.existsByEmail(userDto.getEmail())) {
                throw new IllegalArgumentException("Email already registered.");
            }
            existingUser.setEmail(userDto.getEmail());
        }
        // Password update should be handled separately for security, or via a dedicated DTO
        // For simplicity here, we assume it's not updated via this DTO.

        User updatedUser = userRepository.save(existingUser);
        log.info("User updated: {}", updatedUser.getUsername());
        return mapToDto(updatedUser);
    }

    @Transactional
    @CacheEvict(value = "users", key = "#id") // Evict cache when user is deleted
    @PerformanceMonitorAspect.MonitorPerformance
    public void deleteUser(Long id) {
        log.warn("Deleting user with ID: {}", id);
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
        log.info("User with ID {} deleted.", id);
    }
}
```