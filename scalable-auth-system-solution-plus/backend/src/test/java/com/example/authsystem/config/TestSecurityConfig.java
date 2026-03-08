package com.example.authsystem.config;

import com.example.authsystem.filter.JwtAuthenticationFilter;
import com.example.authsystem.filter.RateLimitFilter;
import com.example.authsystem.security.UserDetailsServiceImpl;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.servlet.HandlerExceptionResolver;

import static org.mockito.Mockito.mock;

/**
 * Test configuration for Spring Security.
 * This can be used to override parts of SecurityConfig for tests,
 * for example, to mock filters or disable CSRF for specific test contexts.
 */
@TestConfiguration
public class TestSecurityConfig {

    // Mock JWT filter to avoid actual JWT processing in many tests
    @Bean
    @Primary
    public JwtAuthenticationFilter mockJwtAuthenticationFilter() {
        return mock(JwtAuthenticationFilter.class);
    }

    // Mock RateLimitFilter to avoid rate limiting interference in tests
    @Bean
    @Primary
    public RateLimitFilter mockRateLimitFilter() {
        return mock(RateLimitFilter.class);
    }

    // You might need a real PasswordEncoder in tests if you're testing actual password matching
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // If you need to test authentication with real UserDetails, but don't want to load from DB in some contexts
    @Bean
    public UserDetailsServiceImpl mockUserDetailsService() {
        return mock(UserDetailsServiceImpl.class);
    }

    // HandlerExceptionResolver might be needed for JwtAuthenticationFilter mock
    @Bean
    public HandlerExceptionResolver handlerExceptionResolver() {
        return mock(HandlerExceptionResolver.class);
    }


    /**
     * Define a simplified security filter chain for tests.
     * This might disable security for certain paths or altogether,
     * or inject mock filters, depending on the test scope.
     *
     * In many integration tests, we want to disable Spring Security or
     * mock the authentication process to focus on controller logic.
     * For full security flow tests, the actual SecurityConfig should be used.
     */
    @Bean
    @Primary // Ensure this chain is picked over the main SecurityConfig's one for test context
    public SecurityFilterChain testSecurityFilterChain(HttpSecurity http,
                                                       JwtAuthenticationFilter jwtAuthenticationFilter,
                                                       RateLimitFilter rateLimitFilter) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // Disable CSRF for simplicity in tests
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(new AntPathRequestMatcher("/**")).permitAll() // Permit all requests by default
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
```