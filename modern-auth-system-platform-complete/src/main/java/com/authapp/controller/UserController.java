package com.authapp.controller;

import com.authapp.dto.UpdateRequest;
import com.authapp.dto.UserResponse;
import com.authapp.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        log.info("Fetching profile for user: {}", userDetails.getUsername());
        UserResponse userProfile = userService.getUserProfile(userDetails.getUsername());
        return ResponseEntity.ok(userProfile);
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<UserResponse> updateCurrentUser(@AuthenticationPrincipal UserDetails userDetails,
                                                          @Valid @RequestBody UpdateRequest updateRequest) {
        log.info("Updating profile for user: {}", userDetails.getUsername());
        UserResponse updatedUser = userService.updateProfile(userDetails.getUsername(), updateRequest);
        return ResponseEntity.ok(updatedUser);
    }
}