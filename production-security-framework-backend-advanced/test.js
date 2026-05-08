package com.example.securityapp.config;

import com.example.securityapp.filter.JwtAuthFilter;
import com.example.securityapp.filter.RateLimitFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true) // Enable @PreAuthorize and @PostAuthorize
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserDetailsService userDetailsService;
    private final JwtAuthFilter jwtAuthFilter;
    private final RateLimitFilter rateLimitFilter;

    // Define security filter chain for HTTP requests
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Configure CSRF: disable for stateless API, enable for stateful UI
            .csrf(csrf -> csrf
                .requestMatchers(new AntPathRequestMatcher("/api/**")).disable() // Stateless API
                .ignoringRequestMatchers(new AntPathRequestMatcher("/h2-console/**")).disable() // For H2 console
            )
            // Configure authorization for various request matchers
            .authorizeHttpRequests(auth -> auth
                // Public endpoints for authentication (API & UI)
                .requestMatchers(
                    new AntPathRequestMatcher("/login**"),
                    new AntPathRequestMatcher("/register**"),
                    new AntPathRequestMatcher("/logout-success"),
                    new AntPathRequestMatcher("/access-denied"),
                    new AntPathRequestMatcher("/api/auth/**") // JWT login/register API
                ).permitAll()
                // Public static resources
                .requestMatchers(
                    new AntPathRequestMatcher("/css/**"),
                    new AntPathRequestMatcher("/js/**"),
                    new AntPathRequestMatcher("/images/**"),
                    new AntPathRequestMatcher("/webjars/**")
                ).permitAll()
                // Swagger UI and API Docs
                .requestMatchers(
                    new AntPathRequestMatcher("/swagger-ui/**"),
                    new AntPathRequestMatcher("/v3/api-docs/**"),
                    new AntPathRequestMatcher("/api-docs/**")
                ).permitAll()
                // H2 Console - only for development/testing, secure in production!
                .requestMatchers(new AntPathRequestMatcher("/h2-console/**")).permitAll() // Permit for local H2 console access
                // All other requests require authentication
                .anyRequest().authenticated()
            )
            // Form-based login for web UI
            .formLogin(form -> form
                .loginPage("/login")
                .defaultSuccessUrl("/products", true) // Redirect to products page on successful login
                .failureUrl("/login?error")
                .permitAll()
            )
            // Logout configuration for web UI
            .logout(logout -> logout
                .logoutRequestMatcher(new AntPathRequestMatcher("/logout"))
                .logoutSuccessUrl("/logout-success")
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
                .permitAll()
            )
            // Exception handling for access denied
            .exceptionHandling(exceptions -> exceptions
                .accessDeniedPage("/access-denied")
            )
            // Session management: STATELESS for API, but for Thymeleaf we need stateful,
            // so we set it to IF_REQUIRED and let Spring Security handle it.
            // For API endpoints handled by JwtAuthFilter, session creation is explicitly prevented.
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
            )
            // Add JWT authentication filter before UsernamePasswordAuthenticationFilter
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            // Add rate limit filter before JWT filter for login endpoint
            .addFilterBefore(rateLimitFilter, JwtAuthFilter.class)
            // Configure H2 console frame options
            .headers(headers -> headers
                .frameOptions(frameOptions -> frameOptions.sameOrigin())
            );

        return http.build();
    }

    // Password encoder bean
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Authentication provider
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    // Authentication manager
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}