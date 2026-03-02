```java
package com.mlutil.middleware;

import com.google.common.util.concurrent.RateLimiter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitFilter.class);

    // Allow 10 requests per second for all API calls
    private final RateLimiter overallRateLimiter = RateLimiter.create(10.0);

    // Potentially specific rate limit for prediction endpoint (e.g., 50 per minute)
    // For simplicity, we'll use a single global rate limiter.
    // In a real system, you might use a Map<String, RateLimiter> for per-IP or per-user limiting.

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Apply rate limiting to all /api/ endpoints (excluding actuator/swagger)
        if (request.getRequestURI().startsWith("/api/") &&
            !request.getRequestURI().startsWith("/api/auth") && // Auth endpoints usually have different/no rate limits
            !request.getRequestURI().startsWith("/actuator") && // Actuator endpoints often managed differently
            !request.getRequestURI().startsWith("/swagger-ui") &&
            !request.getRequestURI().startsWith("/v3/api-docs")) {

            if (!overallRateLimiter.tryAcquire(1, 0, TimeUnit.SECONDS)) { // Try acquiring 1 permit without waiting
                logger.warn("Rate limit exceeded for IP: {}", request.getRemoteAddr());
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.getWriter().write("{\"status\":429,\"message\":\"Too many requests. Please try again later.\"}");
                response.setHeader("Retry-After", "1"); // Suggest client retry after 1 second
                return;
            }
        }
        filterChain.doFilter(request, response);
    }
}
```