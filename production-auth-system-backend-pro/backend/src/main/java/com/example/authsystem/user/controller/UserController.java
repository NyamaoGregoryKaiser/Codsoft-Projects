```java
package com.example.authsystem.user.controller;

import com.example.authsystem.common.exception.ResourceNotFoundException;
import com.example.authsystem.user.dto.PasswordUpdateGroup;
import com.example.authsystem.user.dto.UpdateUserRequest;
import com.example.authsystem.user.dto.UserDTO;
import com.example.authsystem.user.model.User;
import com.example.authsystem.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for user profile management.
 */
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;

    /**
     * Retrieves the profile of the currently authenticated user.
     *
     * @param currentUser The authenticated user details.
     * @return ResponseEntity containing the UserDTO.
     * @throws ResourceNotFoundException if the current user's profile cannot be found.
     */
    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUserProfile(@AuthenticationPrincipal User currentUser) {
        log.info("Fetching profile for current user: {}", currentUser.getEmail());
        UserDTO userDTO = userService.getUserById(currentUser.getId())
                .orElseThrow(() -> {
                    log.error("Current user with ID {} not found, this should not happen.", currentUser.getId());
                    return new ResourceNotFoundException("Current user profile not found.");
                });
        return ResponseEntity.ok(userDTO);
    }

    /**
     * Updates the profile of the currently authenticated user.
     *
     * @param currentUser The authenticated user details.
     * @param request The update request DTO.
     * @return ResponseEntity containing the updated UserDTO.
     */
    @PutMapping("/me")
    public ResponseEntity<UserDTO> updateCurrentUserProfile(
            @AuthenticationPrincipal User currentUser,
            @Validated(PasswordUpdateGroup.class) @RequestBody UpdateUserRequest request) {
        log.info("Updating profile for user: {}", currentUser.getEmail());
        // Ensure the user ID from the path matches the authenticated user's ID for security
        UserDTO updatedUser = userService.updateUser(currentUser.getId(), request);
        return ResponseEntity.ok(updatedUser);
    }

    /**
     * Deletes the profile of the currently authenticated user.
     *
     * @param currentUser The authenticated user details.
     * @return ResponseEntity with no content.
     */
    @DeleteMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> deleteCurrentUserProfile(@AuthenticationPrincipal User currentUser) {
        log.info("Deleting profile for user: {}", currentUser.getEmail());
        userService.deleteUser(currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    /**
     * Retrieves a user profile by ID. Accessible only to ADMINs or the user themselves.
     *
     * @param userId The ID of the user to retrieve.
     * @param currentUser The authenticated user details.
     * @return ResponseEntity containing the UserDTO.
     * @throws ResourceNotFoundException if the user is not found.
     */
    @GetMapping("/{userId}")
    @PreAuthorize("hasAuthority('ADMIN') or #userId == authentication.principal.id")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long userId, @AuthenticationPrincipal User currentUser) {
        log.info("Fetching user by ID: {} by user: {}", userId, currentUser.getEmail());
        UserDTO userDTO = userService.getUserById(userId)
                .orElseThrow(() -> {
                    log.warn("User with ID {} not found.", userId);
                    return new ResourceNotFoundException("User not found with id: " + userId);
                });
        return ResponseEntity.ok(userDTO);
    }

    /**
     * Retrieves all user profiles. Accessible only to ADMINs.
     *
     * @return ResponseEntity containing a list of UserDTOs.
     */
    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        log.info("Fetching all users by Admin.");
        List<UserDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }
}
```