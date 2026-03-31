package com.authsystem.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

@Configuration
public class ApplicationAuditingConfig {

    /**
     * Provides the current auditor (user) for JPA Auditing.
     * Uses Spring Security's SecurityContextHolder to get the authenticated user's username.
     */
    @Bean
    public AuditorAware<String> auditorAware() {
        return () -> {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
                return Optional.of("system"); // Default to 'system' for non-authenticated actions
            }
            return Optional.of(authentication.getName());
        };
    }
}