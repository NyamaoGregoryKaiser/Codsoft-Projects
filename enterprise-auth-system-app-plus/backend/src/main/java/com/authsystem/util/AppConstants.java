package com.authsystem.util;

/**
 * Centralized constants for the application.
 * Includes API paths, security headers, JWT claims, and rate limiting bucket names.
 */
public class AppConstants {

    // API
    public static final String API_BASE = "/api/v1";

    // Security
    public static final String AUTHORIZATION_HEADER = "Authorization";
    public static final String BEARER_PREFIX = "Bearer ";
    public static final String JWT_CLAIM_USER_ID = "userId";
    public static final String JWT_CLAIM_EMAIL = "email";
    public static final String JWT_CLAIM_ROLES = "roles";

    // Whitelist for public endpoints (no authentication required)
    public static final String[] AUTH_WHITELIST = {
            "/swagger-ui/**",
            "/v3/api-docs/**",
            "/swagger-resources/**",
            "/swagger-resources"
    };

    // Rate Limiting
    public static final String AUTH_RATE_LIMIT_BUCKET = "authBucket";

    private AppConstants() {
        // Prevent instantiation
    }
}