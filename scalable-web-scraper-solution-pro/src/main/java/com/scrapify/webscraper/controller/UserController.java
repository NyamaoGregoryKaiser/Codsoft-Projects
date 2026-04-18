```java
package com.scrapify.webscraper.controller;

import com.scrapify.webscraper.dto.UserResponse;
import com.scrapify.webscraper.model.Role;
import com.scrapify.webscraper.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "User Management (Admin)", description = "APIs for managing users by administrators")
@SecurityRequirement(name = "bearerAuth") // Indicates that JWT token is required
@PreAuthorize("hasRole('ADMIN')") // All endpoints in this controller require ADMIN role
public class UserController {

    private final UserService userService;

    @Operation(summary = "Get all users")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "List of all users",
                    content = @Content(mediaType = "application/json",
                            array = @ArraySchema(schema = @Schema(implementation = UserResponse.class)))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden (requires ADMIN role)")
    })
    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        log.info("Admin fetching all users.");
        List<UserResponse> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @Operation(summary = "Get user by ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User details",
                    content = @Content(schema = @Schema(implementation = UserResponse.class))),
            @ApiResponse(responseCode = "404", description = "User not found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden (requires ADMIN role)")
    })
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@Parameter(description = "ID of the user to retrieve") @PathVariable Long id) {
        log.info("Admin fetching user with ID: {}", id);
        UserResponse user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @Operation(summary = "Update user roles")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User roles updated successfully",
                    content = @Content(schema = @Schema(implementation = UserResponse.class))),
            @ApiResponse(responseCode = "404", description = "User not found"),
            @ApiResponse(responseCode = "400", description = "Invalid roles provided"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden (requires ADMIN role)")
    })
    @PutMapping("/{id}/roles")
    public ResponseEntity<UserResponse> updateUserRoles(@Parameter(description = "ID of the user to update roles for") @PathVariable Long id,
                                                        @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "New roles for the user", required = true,
                                                                content = @Content(array = @ArraySchema(schema = @Schema(implementation = Role.class)))) @RequestBody Set<Role> newRoles) {
        log.info("Admin updating roles for user ID {}. New roles: {}", id, newRoles);
        UserResponse updatedUser = userService.updateUserRoles(id, newRoles);
        return ResponseEntity.ok(updatedUser);
    }

    @Operation(summary = "Delete a user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "User deleted successfully"),
            @ApiResponse(responseCode = "404", description = "User not found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden (requires ADMIN role)")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@Parameter(description = "ID of the user to delete") @PathVariable Long id) {
        log.warn("Admin deleting user with ID: {}", id);
        userService.deleteUser(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
```