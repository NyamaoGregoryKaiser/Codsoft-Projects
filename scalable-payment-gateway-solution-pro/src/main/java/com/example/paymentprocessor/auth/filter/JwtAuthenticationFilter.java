```java
package com.example.paymentprocessor.auth.filter;

import com.example.paymentprocessor.auth.service.JwtService;
import com.example.paymentprocessor.auth.service.UserDetailsServiceImpl;
import com.example.paymentprocessor.merchant.repository.MerchantRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsServiceImpl userDetailsService;
    private final MerchantRepository merchantRepository; // To validate API keys

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");
        final String apiKeyHeader = request.getHeader("X-API-Key");
        final String requestURI = request.getRequestURI();

        String username = null;
        String jwt = null;

        // 1. Handle JWT Authentication (for internal users/merchant portal users)
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            jwt = authHeader.substring(7);
            try {
                username = jwtService.extractUsername(jwt);
            } catch (Exception e) {
                log.warn("JWT token parsing failed: {}", e.getMessage());
            }
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
            if (jwtService.isTokenValid(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
                log.debug("JWT authentication successful for user: {}", username);
            }
        }
        
        // 2. Handle API Key Authentication (for merchant API calls, e.g., payment processing)
        // Check if the request is for payment processing endpoint and requires API Key
        // Example: /api/v1/merchants/{merchantId}/payments
        if (apiKeyHeader != null && requestURI.matches("/api/v1/merchants/[0-9a-fA-F-]+/payments.*")) {
            String merchantIdPath = requestURI.split("/")[4]; // Extract merchantId from path
            UUID pathMerchantId = null;
            try {
                pathMerchantId = UUID.fromString(merchantIdPath);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid merchant ID in path: {}", merchantIdPath);
                response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid merchant ID in path.");
                return;
            }

            // Validate API Key against the merchant in the path
            merchantRepository.findByApiKey(apiKeyHeader).ifPresentOrElse(
                merchant -> {
                    if (merchant.getId().equals(pathMerchantId) && merchant.isActive()) {
                        // Create a special authentication token for API Key
                        UsernamePasswordAuthenticationToken apiKeyAuthToken = new UsernamePasswordAuthenticationToken(
                            merchant.getApiKey(), // Principal can be the API Key itself
                            null,
                            List.of(new SimpleGrantedAuthority("MERCHANT_API")) // Special authority for API Key users
                        );
                        apiKeyAuthToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(apiKeyAuthToken);
                        log.debug("API Key authentication successful for merchant: {}", merchant.getId());
                    } else {
                        log.warn("Invalid API Key for merchant ID {} or merchant is inactive. Key provided: {}", pathMerchantId, apiKeyHeader);
                        // Do not set authentication, let Spring Security's access denied handler take over
                    }
                },
                () -> {
                    log.warn("API Key not found: {}", apiKeyHeader);
                    // Do not set authentication
                }
            );
        }

        filterChain.doFilter(request, response);
    }
}
```
*Note: The `JwtAuthenticationFilter` now supports both JWT for user logins and API Key for merchant-to-system interactions. For merchant API, it extracts the merchant ID from the path and validates the `X-API-Key` header against that specific merchant.*

**`AuthService.java`** (For user authentication)