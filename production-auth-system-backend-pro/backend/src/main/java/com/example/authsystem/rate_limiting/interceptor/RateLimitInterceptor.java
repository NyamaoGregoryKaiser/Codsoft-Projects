```java
package com.example.authsystem.rate_limiting.interceptor;

import com.example.authsystem.rate_limiting.service.RateLimitingService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Optional;

/**
 * Interceptor to apply rate limiting to API requests.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitInterceptor implements HandlerInterceptor {

    private final RateLimitingService rateLimitingService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // Use IP address as the key for rate limiting for unauthenticated requests
        // For authenticated requests, consider using user ID from JWT
        String clientIp = Optional.ofNullable(request.getHeader("X-Forwarded-For"))
                .map(ip -> ip.split(",")[0].trim()) // Take the first IP if multiple are present
                .orElse(request.getRemoteAddr());

        // You could refine this: for authenticated users, use their user ID.
        // This example uses IP for simplicity across all requests.
        // For a more robust solution, in a real app, you'd extract principal.getName() from SecurityContextHolder
        // if SecurityContextHolder.getContext().getAuthentication() is not null and authenticated.

        log.debug("Applying rate limit for IP: {}", clientIp);
        rateLimitingService.consumeToken(clientIp, 1);
        return true;
    }
}
```