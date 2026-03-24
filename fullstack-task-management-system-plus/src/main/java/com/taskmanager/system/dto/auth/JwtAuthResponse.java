package com.taskmanager.system.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JwtAuthResponse {
    private String accessToken;
    private String tokenType = "Bearer";
    private String role; // Role of the authenticated user
    private Long userId; // ID of the authenticated user
    private String username; // Username of the authenticated user
}