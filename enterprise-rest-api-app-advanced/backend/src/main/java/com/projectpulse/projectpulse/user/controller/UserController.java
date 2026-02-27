package com.projectpulse.projectpulse.user.controller;

import com.projectpulse.projectpulse.exception.ResourceNotFoundException;
import com.projectpulse.projectpulse.user.dto.UserDto;
import com.projectpulse.projectpulse.user.dto.UserUpdateDto;
import com.projectpulse.projectpulse.user.entity.User;
import com.projectpulse.projectpulse.user.service.UserService;
import com.projectpulse.projectpulse.util.Mappers;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User management APIs")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;

    @Operation(summary = "Get current user's profile")
    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(@AuthenticationPrincipal User userDetails) {
        if (userDetails == null) {
            throw new ResourceNotFoundException("No authenticated user found.");
        }
        UserDto userDto = Mappers.toUserDto(userDetails); // Convert UserDetails to UserDto
        return ResponseEntity.ok(userDto);
    }

    @Operation(summary = "Get a user by ID")
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @userAccessChecker.check(#id, authentication)") // Custom SpEL access check
    public ResponseEntity<UserDto> getUserById(@PathVariable Long id) {
        UserDto user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @Operation(summary = "Get all users (Admin only)")
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        List<UserDto> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @Operation(summary = "Update a user by ID")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @userAccessChecker.check(#id, authentication)") // Custom SpEL access check
    public ResponseEntity<UserDto> updateUser(@PathVariable Long id, @Valid @RequestBody UserUpdateDto updateDto) {
        UserDto updatedUser = userService.updateUser(id, updateDto);
        return ResponseEntity.ok(updatedUser);
    }

    @Operation(summary = "Delete a user by ID (Admin only)")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}