package com.ecommerce.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Bucket4j;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    @Value("${app.rate-limit.enabled:false}")
    private boolean rateLimitEnabled;

    @Value("${app.rate-limit.max-requests:100}")
    private int maxRequests;

    @Value("${app.rate-limit.time-window-seconds:60}")
    private int timeWindowSeconds;

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        if (!rateLimitEnabled) {
            filterChain.doFilter(request, response);
            return;
        }

        String ipAddress = request.getRemoteAddr();
        Bucket bucket = buckets.computeIfAbsent(ipAddress, this::newBucket);

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.getWriter().write("Too many requests from this IP address. Please try again later.");
            response.setHeader("Retry-After", String.valueOf(timeWindowSeconds));
        }
    }

    private Bucket newBucket(String ipAddress) {
        Bandwidth limit = Bandwidth.classic(maxRequests, Refill.greedy(maxRequests, Duration.ofSeconds(timeWindowSeconds)));
        return Bucket4j.builder().addLimit(limit).build();
    }
}