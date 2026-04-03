```java
package com.example.authsystem.config;

import com.example.authsystem.rate_limiting.interceptor.RateLimitInterceptor;
import com.example.authsystem.user.service.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
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
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import static com.example.authsystem.user.model.Role.ADMIN;
import static com.example.authsystem.user.model.Role.USER;

/**
 * Security configuration for the application.
 * Defines authentication providers, security filter chain, and CORS settings.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Enables @PreAuthorize and @PostAuthorize annotations
@RequiredArgsConstructor
public class SecurityConfig implements WebMvcConfigurer {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserDetailsServiceImpl userDetailsService;
    private final RateLimitInterceptor rateLimitInterceptor;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable) // Disable CSRF for stateless API
                .authorizeHttpRequests(request -> request
                        .requestMatchers("/api/v1/auth/**").permitAll() // Public endpoints for auth
                        .requestMatchers("/error").permitAll() // Allow error endpoint
                        .requestMatchers(HttpMethod.GET, "/api/v1/tasks").hasAnyAuthority(ADMIN.name(), USER.name()) // Only authenticated users can view tasks
                        .requestMatchers(HttpMethod.POST, "/api/v1/tasks").hasAnyAuthority(ADMIN.name(), USER.name()) // Only authenticated users can create tasks
                        .requestMatchers(HttpMethod.PUT, "/api/v1/tasks/**").hasAnyAuthority(ADMIN.name(), USER.name())
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/tasks/**").hasAnyAuthority(ADMIN.name(), USER.name())
                        .requestMatchers("/api/v1/users/**").hasAnyAuthority(ADMIN.name(), USER.name())
                        .requestMatchers("/api/v1/admin/**").hasAuthority(ADMIN.name()) // Admin-specific endpoints
                        .anyRequest().authenticated()) // All other requests require authentication
                .sessionManagement(manager -> manager.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // Stateless session for JWT
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class); // Add JWT filter before Spring Security's
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * Register custom interceptors.
     * In this case, the RateLimitInterceptor is added to all API endpoints.
     * @param registry InterceptorRegistry
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(rateLimitInterceptor).addPathPatterns("/api/v1/**");
    }
}
```