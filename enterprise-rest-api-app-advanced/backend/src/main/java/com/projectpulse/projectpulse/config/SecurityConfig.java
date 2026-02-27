package com.projectpulse.projectpulse.config;

import com.projectpulse.projectpulse.auth.jwt.JwtAuthFilter;
import com.projectpulse.projectpulse.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
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

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true) // Enable method level security like @PreAuthorize
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserService userService; // UserDetailsService implementation

    @Value("${app.cors.allowed-origins}")
    private String[] allowedOrigins;
    @Value("${app.cors.allowed-methods}")
    private String[] allowedMethods;
    @Value("${app.cors.allowed-headers}")
    private String[] allowedHeaders;
    @Value("${app.cors.exposed-headers}")
    private String[] exposedHeaders;
    @Value("${app.cors.allow-credentials}")
    private boolean allowCredentials;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable) // Disable CSRF for REST APIs
                .cors(cors -> cors.configurationSource(corsConfigurationSource())) // Enable CORS
                .authorizeHttpRequests(authorize -> authorize
                        // Public endpoints
                        .requestMatchers("/api/v1/auth/**", "/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/projects/**").permitAll() // Allow public access to view projects
                        .requestMatchers(HttpMethod.POST, "/api/v1/users/register").permitAll() // Allow user registration
                        .requestMatchers("/actuator/**").permitAll() // Allow access to actuator endpoints for monitoring

                        // Authenticated endpoints
                        .requestMatchers("/api/v1/users/me").authenticated() // User can access their own profile
                        .requestMatchers(HttpMethod.PUT, "/api/v1/users/{id}").access(new UserAccessChecker()) // Custom access for user update
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/users/{id}").hasRole("ADMIN")

                        // Admin specific endpoints
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN") // Example admin path
                        .requestMatchers(HttpMethod.POST, "/api/v1/projects").hasAnyRole("ADMIN", "USER") // Users can create projects
                        .requestMatchers(HttpMethod.PUT, "/api/v1/projects/{id}").hasAnyRole("ADMIN", "USER")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/projects/{id}").hasAnyRole("ADMIN", "USER") // Can delete own project or admin can delete any

                        .anyRequest().authenticated() // All other requests require authentication
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS) // Use stateless sessions for REST APIs
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class); // Add JWT filter before UsernamePasswordAuthenticationFilter

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userService); // Set our custom UserDetailsService
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(allowedOrigins));
        configuration.setAllowedMethods(Arrays.asList(allowedMethods));
        configuration.setAllowedHeaders(Arrays.asList(allowedHeaders));
        configuration.setExposedHeaders(Arrays.asList(exposedHeaders));
        configuration.setAllowCredentials(allowCredentials);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration); // Apply CORS to all paths
        return source;
    }

    // Custom Access Checker for user updates (demonstrates SpEL for authorization)
    // Note: For more complex logic, a custom AccessDecisionVoter or annotation would be better.
    public static class UserAccessChecker implements org.springframework.security.authorization.AuthorizationDecisionSupplier {
        @Override
        public org.springframework.security.authorization.AuthorizationDecision get() {
            return new org.springframework.security.authorization.AuthorizationDecision(false); // Default deny
        }

        @Override
        public org.springframework.security.authorization.AuthorizationDecision get(
                org.springframework.security.core.Authentication authentication,
                org.springframework.security.web.access.intercept.RequestAuthorizationContext context) {

            // Get the user ID from the path variable
            String requestedUserId = context.getVariables().get("id");

            // Get the authenticated user's ID
            if (authentication != null && authentication.getPrincipal() instanceof com.projectpulse.projectpulse.user.entity.User userDetails) {
                if (userDetails.getId().toString().equals(requestedUserId)) {
                    return new org.springframework.security.authorization.AuthorizationDecision(true); // User can update their own profile
                }
                // Check if the user has ADMIN role
                boolean isAdmin = authentication.getAuthorities().stream()
                        .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ROLE_ADMIN"));
                if (isAdmin) {
                    return new org.springframework.security.authorization.AuthorizationDecision(true); // Admin can update any profile
                }
            }
            return new org.springframework.security.authorization.AuthorizationDecision(false);
        }
    }
}