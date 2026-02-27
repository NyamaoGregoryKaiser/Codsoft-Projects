package com.projectpulse.projectpulse.config;

import com.projectpulse.projectpulse.exception.TooManyRequestsException;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Bucket4j;
import io.github.bucket4j.Refill;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitingInterceptor implements HandlerInterceptor {

    // Key: client IP address
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    // Define the rate limit: 10 requests per minute
    private final Bandwidth limit = Bandwidth.simple(10, Duration.ofMinutes(1));

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String clientIp = getClientIp(request);
        Bucket bucket = buckets.computeIfAbsent(clientIp, k -> Bucket4j.builder().addLimit(limit).build());

        if (bucket.tryConsume(1)) {
            // Request allowed
            return true;
        } else {
            // Request denied
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.getWriter().write("Too many requests: You have exceeded the API rate limit.");
            throw new TooManyRequestsException("Too many requests: You have exceeded the API rate limit.");
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || !xfHeader.contains(".")) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}