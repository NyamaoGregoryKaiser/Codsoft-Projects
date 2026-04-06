package com.cms.system.interceptor;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Bucket4j;
import io.github.bucket4j.Refill;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
public class RateLimitingInterceptor implements HandlerInterceptor {

    // A map to store buckets per IP address
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    // Define the rate limit: 10 requests per minute
    private final int CAPACITY = 10;
    private final int REFILL_AMOUNT = 10;
    private final Duration REFILL_DURATION = Duration.ofMinutes(1);

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String clientIp = getClientIp(request);
        Bucket bucket = buckets.computeIfAbsent(clientIp, this::newBucket);

        if (bucket.tryConsume(1)) {
            return true;
        } else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.getWriter().write("Too many requests. Please try again later.");
            log.warn("Rate limit exceeded for IP: {}", clientIp);
            return false;
        }
    }

    private Bucket newBucket(String key) {
        Refill refill = Refill.greedy(REFILL_AMOUNT, REFILL_DURATION);
        Bandwidth limit = Bandwidth.builder().capacity(CAPACITY).refillGreedy(REFILL_AMOUNT, REFILL_DURATION).build();
        return Bucket4j.builder().addLimit(limit).build();
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || !xfHeader.contains(request.getRemoteAddr())) {
            return request.getRemoteAddr();
        }
        // If behind a proxy, X-Forwarded-For will contain a comma-separated list of IPs
        return xfHeader.split(",")[0];
    }
}