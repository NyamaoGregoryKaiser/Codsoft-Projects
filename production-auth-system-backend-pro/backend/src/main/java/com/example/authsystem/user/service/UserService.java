```java
package com.example.authsystem.user.service;

import com.example.authsystem.common.exception.EmailAlreadyExistsException;
import com.example.authsystem.common.exception.ResourceNotFoundException;
import com.example.authsystem.user.dto.UpdateUserRequest;
import com.example.authsystem.user.dto.UserDTO;
import com.example.authsystem.user.model.User;
import com.example.authsystem.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for managing user-related operations (profile retrieval, update).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Retrieves a user by their ID.
     *
     * @param userId The ID of the user.
     * @return An Optional containing the UserDTO if found, empty otherwise.
     */
    @Cacheable(value = "users", key = "#userId")
    public Optional<UserDTO> getUserById(Long userId) {
        log.debug("Fetching user by ID: {}", userId);
        return userRepository.findById(userId)
                .map(this::convertToDTO);
    }

    /**
     * Retrieves a user by their email.
     * This method is generally used internally, for security concerns, user DTO should be used for external exposure.
     *
     * @param email The email of the user.
     * @return An Optional containing the User if found, empty otherwise.
     */
    public Optional<User> getUserByEmail(String email) {
        log.debug("Fetching user by email: {}", email);
        return userRepository.findByEmail(email);
    }


    /**
     * Updates an existing user's information.
     *
     * @param userId The ID of the user to update.
     * @param request The UpdateUserRequest DTO with new user data.
     * @return The updated UserDTO.
     * @throws ResourceNotFoundException If the user with the given ID is not found.
     * @throws EmailAlreadyExistsException If the new email already exists for another user.
     */
    @Transactional
    @CachePut(value = "users", key = "#userId")
    @CacheEvict(value = "users", key = "#request.email", condition = "#result != null && #request.email != null") // Evict old email cache if email changed
    public UserDTO updateUser(Long userId, UpdateUserRequest request) {
        log.info("Updating user with ID: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.warn("User with ID {} not found for update.", userId);
                    return new ResourceNotFoundException("User not found with id: " + userId);
                });

        if (!user.getEmail().equals(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            log.warn("Update failed: Email {} already exists for another user.", request.getEmail());
            throw new EmailAlreadyExistsException("Email already in use by another user: " + request.getEmail());
        }

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        User updatedUser = userRepository.save(user);
        log.info("User {} (ID: {}) updated successfully.", updatedUser.getEmail(), updatedUser.getId());
        return convertToDTO(updatedUser);
    }

    /**
     * Deletes a user by their ID.
     *
     * @param userId The ID of the user to delete.
     * @throws ResourceNotFoundException If the user with the given ID is not found.
     */
    @Transactional
    @CacheEvict(value = "users", key = "#userId")
    public void deleteUser(Long userId) {
        log.info("Attempting to delete user with ID: {}", userId);
        if (!userRepository.existsById(userId)) {
            log.warn("Deletion failed: User with ID {} not found.", userId);
            throw new ResourceNotFoundException("User not found with id: " + userId);
        }
        userRepository.deleteById(userId);
        log.info("User with ID {} deleted successfully.", userId);
    }

    /**
     * Retrieves all users.
     * This method is typically restricted to ADMIN roles.
     *
     * @return A list of all UserDTOs.
     */
    public List<UserDTO> getAllUsers() {
        log.debug("Fetching all users.");
        return userRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private UserDTO convertToDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .roles(user.getRoles())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
```