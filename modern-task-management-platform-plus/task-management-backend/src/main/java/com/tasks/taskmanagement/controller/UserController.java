```java
package com.tasks.taskmanagement.controller;

import com.tasks.taskmanagement.dto.UserDTO;
import com.tasks.taskmanagement.entity.User;
import com.tasks.taskmanagement.service.AuthService;
import com.tasks.taskmanagement.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;
    private final AuthService authService;

    // Get current authenticated user's profile
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDTO> getCurrentUserProfile() {
        User currentUser = authService.getCurrentAuthenticatedUser();
        log.info("Fetching profile for current user: {}", currentUser.getUsername());
        UserDTO userDTO = userService.getUserById(currentUser.getId());
        return ResponseEntity.ok(userDTO);
    }

    // Get user by ID (Admin only or self)
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @authService.getCurrentAuthenticatedUser().getId().equals(#id)")
    public ResponseEntity<UserDTO> getUserById(@PathVariable UUID id) {
        log.info("Fetching user with ID: {}", id);
        UserDTO userDTO = userService.getUserById(id);
        return ResponseEntity.ok(userDTO);
    }

    // Get all users (Admin only)
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        log.info("Fetching all users.");
        List<UserDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    // Update user (Admin or self)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @authService.getCurrentAuthenticatedUser().getId().equals(#id)")
    public ResponseEntity<UserDTO> updateUser(@PathVariable UUID id, @Valid @RequestBody UserDTO userDTO) {
        log.info("Updating user with ID: {}", id);
        UserDTO updatedUser = userService.updateUser(id, userDTO);
        return ResponseEntity.ok(updatedUser);
    }

    // Delete user (Admin only)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        log.info("Deleting user with ID: {}", id);
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // Admin only: Update user role
    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDTO> updateUserRole(@PathVariable UUID id, @RequestParam User.Role role) {
        log.info("Updating role for user ID: {} to {}", id, role);
        UserDTO updatedUser = userService.updateRole(id, role);
        return ResponseEntity.ok(updatedUser);
    }
}
```