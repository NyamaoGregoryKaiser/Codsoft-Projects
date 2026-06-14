```java
package com.tasks.taskmanagement.service;

import com.tasks.taskmanagement.dto.UserDTO;
import com.tasks.taskmanagement.entity.User;
import com.tasks.taskmanagement.exception.ResourceNotFoundException;
import com.tasks.taskmanagement.repository.UserRepository;
import com.tasks.taskmanagement.util.MapperUtil;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final MapperUtil mapperUtil;

    @Cacheable(value = "users", key = "#id")
    public UserDTO getUserById(UUID id) {
        log.info("Fetching user with ID: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));
        return mapperUtil.map(user, UserDTO.class);
    }

    @Cacheable(value = "users", key = "'all'")
    public List<UserDTO> getAllUsers() {
        log.info("Fetching all users.");
        return userRepository.findAll().stream()
                .map(user -> mapperUtil.map(user, UserDTO.class))
                .collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = "users", allEntries = true) // Evict all user caches on update/delete
    public UserDTO updateUser(UUID id, UserDTO userDTO) {
        log.info("Updating user with ID: {}", id);
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));

        // Update fields that are allowed to be changed
        existingUser.setFirstName(userDTO.getFirstName());
        existingUser.setLastName(userDTO.getLastName());
        existingUser.setEmail(userDTO.getEmail());
        existingUser.setUsername(userDTO.getUsername());
        // Do not allow password or role change directly via this method for security
        // Use separate methods for password reset and role management

        User updatedUser = userRepository.save(existingUser);
        log.info("User with ID {} updated successfully.", id);
        return mapperUtil.map(updatedUser, UserDTO.class);
    }

    @Transactional
    @CacheEvict(value = "users", allEntries = true)
    public void deleteUser(UUID id) {
        log.info("Deleting user with ID: {}", id);
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found with ID: " + id);
        }
        userRepository.deleteById(id);
        log.info("User with ID {} deleted successfully.", id);
    }

    // This method is for internal use or admin-level role changes, not exposed directly to general users
    @Transactional
    @CacheEvict(value = "users", allEntries = true)
    public UserDTO updateRole(UUID id, User.Role newRole) {
        log.info("Updating role for user ID: {} to {}", id, newRole);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));
        user.setRole(newRole);
        User updatedUser = userRepository.save(user);
        log.info("User ID {} role updated to {}.", id, newRole);
        return mapperUtil.map(updatedUser, UserDTO.class);
    }

    // Helper method to retrieve User entity (not DTO)
    public User getUserEntityById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));
    }
}
```