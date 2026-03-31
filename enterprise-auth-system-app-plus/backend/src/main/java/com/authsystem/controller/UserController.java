package com.authsystem.controller;

import com.authsystem.dto.user.UserDTO;
import com.authsystem.dto.user.UserProfileDTO;
import com.authsystem.service.UserService;
import com.authsystem.util.AppConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for managing user profiles and (for ADMINs) all users.
 * Provides endpoints for retrieving user details.
 */
@RestController
@RequestMapping(AppConstants.API_BASE + "/users")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Users", description = "User profile and administration API")
@SecurityRequirement(name = "bearerAuth") // Requires JWT for all user operations
public class UserController {

    private final UserService userService;

    /**
     * Retrieves the profile of the currently authenticated user.
     *
     * @return A ResponseEntity with the UserProfileDTO of the current user.
     */
    @Operation(summary = "Get current user profile", responses = {
            @ApiResponse(responseCode = "200", description = "Current user profile retrieved"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<UserProfileDTO> getCurrentUserProfile() {
        log.info("Fetching profile for current authenticated user.");
        UserProfileDTO userProfile = userService.getCurrentUserProfile();
        return ResponseEntity.ok(userProfile);
    }

    /**
     * Retrieves a user by their ID. Requires 'ADMIN' role.
     *
     * @param userId The ID of the user to retrieve.
     * @return A ResponseEntity with the UserDTO.
     */
    @Operation(summary = "Get user by ID (Admin only)", responses = {
            @ApiResponse(responseCode = "200", description = "User found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - ADMIN role required"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDTO> getUserById(@Parameter(description = "ID of the user to retrieve") @PathVariable Long userId) {
        log.info("Fetching user with ID: {}", userId);
        UserDTO user = userService.getUserById(userId);
        return ResponseEntity.ok(user);
    }

    /**
     * Retrieves all users. Requires 'ADMIN' role.
     *
     * @return A ResponseEntity with a list of all UserDTOs.
     */
    @Operation(summary = "Get all users (Admin only)", responses = {
            @ApiResponse(responseCode = "200", description = "List of all users retrieved"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - ADMIN role required")
    })
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        log.info("Fetching all users.");
        List<UserDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }
}