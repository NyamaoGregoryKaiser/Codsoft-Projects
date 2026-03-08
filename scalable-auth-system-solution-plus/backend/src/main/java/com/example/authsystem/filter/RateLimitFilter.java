package com.example.authsystem.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    // A map to store buckets for different client IPs. In a distributed system, this would be Redis.
    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Define the rate limit: 10 requests per minute
    private final Bandwidth limit = Bandwidth.simple(10, Duration.ofMinutes(1));

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String clientIp = getClientIp(request);

        // Get or create a bucket for the client IP
        Bucket bucket = cache.computeIfAbsent(clientIp, k -> Bucket4j.builder().addLimit(limit).build());

        // Try to consume a token
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

        if (probe.isConsumed()) {
            // Request allowed
            response.setHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));
            response.setHeader("X-Rate-Limit-Retry-After-Seconds", "0");
            filterChain.doFilter(request, response);
        } else {
            // Request denied
            long waitForRefill = probe.getNanosToWaitForRefill() / 1_000_000_000;
            response.setHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));
            response.setHeader("X-Rate-Limit-Retry-After-Seconds", String.valueOf(waitForRefill));
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);

            Map<String, Object> errorDetails = Map.of(
                    "timestamp", System.currentTimeMillis(),
                    "status", HttpStatus.TOO_MANY_REQUESTS.value(),
                    "error", "Too Many Requests",
                    "message", "You have exceeded your API rate limit. Try again in " + waitForRefill + " seconds.",
                    "path", request.getRequestURI()
            );
            response.getWriter().write(objectMapper.writeValueAsString(errorDetails));
            log.warn("Rate limit exceeded for IP: {}. Path: {}", clientIp, request.getRequestURI());
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || !xfHeader.contains(".")) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0]; // In case of multiple proxies, first IP is the client
    }
}