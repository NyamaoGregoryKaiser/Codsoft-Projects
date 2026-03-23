```java
package com.tasksyncpro.tasksyncpro.config;

import com.tasksyncpro.tasksyncpro.security.JwtRequestFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Enables @PreAuthorize and @PostAuthorize annotations
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtRequestFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll() // Allow auth endpoints
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll() // Allow Swagger UI
                .requestMatchers("/actuator/**").permitAll() // Allow actuator endpoints for monitoring
                .requestMatchers("/error").permitAll() // Allow Spring Boot's default error page
                .anyRequest().authenticated() // All other requests require authentication
            )
            .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authenticationProvider(authenticationProvider)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:3000")); // Allow frontend origin
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * Helper service for custom security checks in @PreAuthorize annotations.
     * This allows more complex authorization logic than simple role checks.
     */
    @Configuration
    public static class SecurityService {
        private final UserRepository userRepository;

        public SecurityService(UserRepository userRepository) {
            this.userRepository = userRepository;
        }

        public boolean isOwner(Long userId) {
            // Get current authenticated user's ID
            String username = (String) org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            Long currentUserId = userRepository.findByUsername(username)
                                 .map(com.tasksyncpro.tasksyncpro.entity.User::getId)
                                 .orElse(null);
            return currentUserId != null && currentUserId.equals(userId);
        }

        // Dummy implementations for project/task ownership/membership.
        // In a real app, these would query Project/Task repositories to check relationships.
        public boolean isProjectOwner(Long projectId) {
            // Placeholder: Check if current user is the owner of the project
            // For demo: User 'admin' owns project 1. Other users own other projects.
            String username = (String) org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            if ("admin".equals(username) && projectId == 1L) return true;
            return true; // Simplified for demo, replace with actual logic
        }

        public boolean isProjectMember(Long projectId) {
            // Placeholder: Check if current user is a member of the project
            return true; // Simplified for demo, replace with actual logic
        }

        public boolean isTaskMember(Long taskId) {
            // Placeholder: Check if current user is a member of the project associated with the task
            return true; // Simplified for demo, replace with actual logic
        }
    }
}
```