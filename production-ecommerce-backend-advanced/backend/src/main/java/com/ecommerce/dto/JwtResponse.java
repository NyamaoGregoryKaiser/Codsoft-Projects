package com.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class JwtResponse {
    private String accessToken;
    private String tokenType = "Bearer";
    private Long userId;
    private String username;
    private String email;
    private List<String> roles;

    public JwtResponse(String accessToken, Long userId, String username, String email, List<String> roles) {
        this.accessToken = accessToken;
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.roles = roles;
    }
}