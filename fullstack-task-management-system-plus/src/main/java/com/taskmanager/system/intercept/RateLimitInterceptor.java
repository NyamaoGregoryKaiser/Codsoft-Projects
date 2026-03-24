package com.taskmanager.system.intercept;

import com.google.common.util.concurrent.RateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.concurrent.TimeUnit;

@Component
@Slf4j
public class RateLimitInterceptor implements HandlerInterceptor {

    // Allow 10 requests per second
    private final RateLimiter rateLimiter = RateLimiter.create(10.0); // 10 permits per second

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (rateLimiter.tryAcquire(1, 0, TimeUnit.SECONDS)) { // Try to acquire 1 token immediately
            return true;
        } else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.getWriter().write("Too many requests");
            response.setHeader("Retry-After", String.valueOf(1)); // Suggest client to retry after 1 second
            log.warn("Rate limit exceeded for IP: {}", request.getRemoteAddr());
            return false;
        }
    }
}