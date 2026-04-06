package com.example.ecommerce.api.config;

import com.google.common.util.concurrent.RateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.concurrent.TimeUnit;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    // Allow 20 requests per second globally for demonstration
    private final RateLimiter rateLimiter = RateLimiter.create(20.0);

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // You could implement more sophisticated rate limiting here:
        // - Per IP address
        // - Per user (after authentication)
        // - Different limits for different endpoints
        // For simplicity, this is a global rate limit.

        if (!rateLimiter.tryAcquire(1, 0, TimeUnit.SECONDS)) { // Try to acquire a permit immediately
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.getWriter().write("Too many requests. Please try again later.");
            response.setHeader("Retry-After", "1"); // Suggest client to retry after 1 second
            return false; // Request blocked
        }
        return true; // Request allowed
    }
}