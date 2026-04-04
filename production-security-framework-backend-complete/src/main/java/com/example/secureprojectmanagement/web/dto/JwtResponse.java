package com.example.secureprojectmanagement.web.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class JwtResponse {
    private String accessToken;
    private String tokenType = "Bearer";
    private Long userId;
    private String username;
    private String roles; // Comma separated roles

    public JwtResponse(String accessToken, Long userId, String username, String roles) {
        this.accessToken = accessToken;
        this.userId = userId;
        this.username = username;
        this.roles = roles;
    }
}