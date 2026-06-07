```java
package com.example.authsystem.service;

import com.example.authsystem.dto.UserDto;
import com.example.authsystem.entity.User;
import com.example.authsystem.exception.CustomExceptions;
import com.example.authsystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<User> findAllUsers() {
        return userRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<User> findUserById(UUID id) {
        return userRepository.findById(id);
    }

    @Transactional
    public User updateUser(UUID id, UserDto userDto) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("User not found with id: " + id));

        // Update fields that are allowed to be changed
        existingUser.setFirstName(userDto.getFirstName());
        existingUser.setLastName(userDto.getLastName());
        existingUser.setEmail(userDto.getEmail()); // Consider if email update should be more complex (e.g., verification)

        // Roles are not updated via this DTO in this example, typically handled by separate admin endpoints
        // Password updates should also be handled separately for security reasons

        User updatedUser = userRepository.save(existingUser);
        log.info("Updated user with ID: {}", updatedUser.getId());
        return updatedUser;
    }

    @Transactional
    public void deleteUser(UUID id) {
        if (!userRepository.existsById(id)) {
            throw new CustomExceptions.ResourceNotFoundException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
        log.info("Deleted user with ID: {}", id);
    }

    /**
     * Helper method for @PreAuthorize to check if the current authenticated user is the one being accessed/modified.
     * This allows users to access/modify their own profiles.
     * @param userId The ID of the user being accessed.
     * @return true if the authenticated user's ID matches the provided userId, false otherwise.
     */
    public boolean isCurrentUser(UUID userId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User userDetails) {
            return userDetails.getId().equals(userId);
        }
        return false;
    }
}
```