```java
package com.cms.example.util;

import com.google.common.util.concurrent.RateLimiter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Component
@Order(1) // Ensure this filter runs before Spring Security filters
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    // Global rate limiter for all requests (e.g., 100 requests per second)
    private final RateLimiter globalRateLimiter = RateLimiter.create(100.0);

    // IP-based rate limiters (e.g., 10 requests per 10 seconds per IP)
    private final ConcurrentHashMap<String, RateLimiter> ipRateLimiters = new ConcurrentHashMap<>();
    private final double IP_RATE_LIMIT_PER_SECOND = 1.0; // 1 request per second, or 10 requests per 10 seconds

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Apply global rate limit
        if (!globalRateLimiter.tryAcquire()) {
            log.warn("Global rate limit exceeded for request to {}", request.getRequestURI());
            sendTooManyRequestsError(response);
            return;
        }

        // Apply IP-based rate limit for specific endpoints (e.g., login/register)
        String requestURI = request.getRequestURI();
        boolean applyIpRateLimit = requestURI.startsWith("/api/v1/auth"); // Apply to auth endpoints

        if (applyIpRateLimit) {
            String clientIp = getClientIp(request);
            RateLimiter ipLimiter = ipRateLimiters.computeIfAbsent(clientIp, k -> RateLimiter.create(IP_RATE_LIMIT_PER_SECOND));

            if (!ipLimiter.tryAcquire()) {
                log.warn("IP rate limit exceeded for IP: {} on URI: {}", clientIp, requestURI);
                sendTooManyRequestsError(response);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || !xfHeader.contains(".")) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0]; // Return the first IP in the list
    }

    private void sendTooManyRequestsError(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.getWriter().write("Too many requests. Please try again later.");
        response.setHeader("Retry-After", String.valueOf(TimeUnit.SECONDS.toSeconds(10))); // Suggest waiting 10 seconds
        response.setContentType("text/plain");
    }
}
```