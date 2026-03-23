package com.example.chat.controller;

import com.example.chat.dto.UserDto;
import com.example.chat.exception.ResourceNotFoundException;
import com.example.chat.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User management APIs")
@SecurityRequirement(name = "bearerAuth")
@Slf4j
public class UserController {

    private final UserService userService;

    @Operation(summary = "Get current authenticated user's details", responses = {
            @ApiResponse(responseCode = "200", description = "User details retrieved"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username = userDetails.getUsername();
        log.debug("Fetching current user details for: {}", username);
        UserDto userDto = userService.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found."));
        return ResponseEntity.ok(userDto);
    }

    @Operation(summary = "Get user details by ID", responses = {
            @ApiResponse(responseCode = "200", description = "User details retrieved"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long id) {
        log.debug("Fetching user details for ID: {}", id);
        UserDto userDto = userService.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));
        return ResponseEntity.ok(userDto);
    }
}