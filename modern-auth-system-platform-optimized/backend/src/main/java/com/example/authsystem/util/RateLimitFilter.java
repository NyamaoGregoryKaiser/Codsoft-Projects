```java
package com.example.authsystem.util;

import com.example.authsystem.exception.CustomExceptions;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Bucket4j;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    // Define rate limit: 10 requests per 1 minute
    private final Bandwidth limit = Bandwidth.simple(10, Duration.ofMinutes(1));

    private Bucket getBucket(String key) {
        return cache.computeIfAbsent(key, k -> Bucket4j.builder().addLimit(limit).build());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Apply rate limiting to /api/auth/login and /api/auth/register for instance
        // You can expand this logic for different endpoints or by IP address
        if (request.getRequestURI().startsWith("/api/auth/login") || request.getRequestURI().startsWith("/api/auth/register")) {
            String ipAddress = request.getRemoteAddr();
            Bucket bucket = getBucket(ipAddress);
            ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

            if (probe.isConsumed()) {
                response.addHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));
                filterChain.doFilter(request, response);
            } else {
                long waitForRefill = probe.getNanosToWaitForRefill() / 1_000_000_000; // Convert to seconds
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.addHeader("X-Rate-Limit-Retry-After-Seconds", String.valueOf(waitForRefill));
                response.getWriter().write("{\"status\":429, \"error\":\"Too Many Requests\", \"message\":\"You have exceeded the API rate limit. Try again in " + waitForRefill + " seconds.\"}");
                log.warn("Rate limit exceeded for IP: {}", ipAddress);
            }
        } else {
            filterChain.doFilter(request, response);
        }
    }
}
```