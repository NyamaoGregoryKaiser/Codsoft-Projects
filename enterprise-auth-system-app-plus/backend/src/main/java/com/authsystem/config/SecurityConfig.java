package com.authsystem.config;

import com.authsystem.security.JwtAuthenticationEntryPoint;
import com.authsystem.security.JwtAuthenticationFilter;
import com.authsystem.util.AppConstants;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Spring Security configuration for the application.
 * Defines security filters, authentication providers, authorization rules, and CORS settings.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(securedEnabled = true, jsr250Enabled = true) // Enable method-level security annotations
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationEntryPoint authenticationEntryPoint;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    /**
     * Configures the security filter chain.
     * Defines authorization rules for different endpoints, JWT filter, exception handling, and session management.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource())) // Enable and configure CORS
                .csrf(AbstractHttpConfigurer::disable) // Disable CSRF as JWT is stateless
                .exceptionHandling(exception -> exception.authenticationEntryPoint(authenticationEntryPoint)) // Handle unauthorized access
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // Use stateless sessions for JWT
                .authorizeHttpRequests(authorize -> authorize
                        // Public endpoints (authentication/registration, Swagger UI)
                        .requestMatchers(AppConstants.AUTH_WHITELIST).permitAll()
                        // Public endpoints for authentication (rate limited)
                        .requestMatchers(
                                AppConstants.API_BASE + "/auth/login",
                                AppConstants.API_BASE + "/auth/register"
                        ).permitAll()
                        // User endpoints (requires authentication)
                        .requestMatchers(AppConstants.API_BASE + "/users/**").hasAnyRole("USER", "ADMIN")
                        // Admin endpoints (requires ADMIN role)
                        .requestMatchers(AppConstants.API_BASE + "/admin/**").hasRole("ADMIN")
                        // Note endpoints (requires authentication, specific roles for CRUD)
                        .requestMatchers(AppConstants.API_BASE + "/notes/**").hasAnyRole("USER", "ADMIN")
                        // All other requests require authentication
                        .anyRequest().authenticated()
                );

        // Add JWT authentication filter before UsernamePasswordAuthenticationFilter
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Provides a BCryptPasswordEncoder bean for password hashing.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Exposes the AuthenticationManager bean, which is used for authenticating users.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    /**
     * Configures CORS (Cross-Origin Resource Sharing) settings.
     * Allows requests from the frontend origin, specifies allowed methods, headers, and credentials.
     */
    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:3000")); // Allow requests from React frontend
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*")); // Allow all headers
        configuration.setAllowCredentials(true); // Allow sending cookies/auth headers
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration); // Apply CORS to all paths
        return source;
    }
}