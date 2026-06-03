```java
package com.taskflow.config;

import com.taskflow.exception.TooManyRequestsException;
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

    // A map to store buckets for different IP addresses
    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    // Define the rate limit: 10 requests per minute
    private final Bandwidth limit = Bandwidth.classic(10, Refill.greedy(10, Duration.ofMinutes(1)));

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String ipAddress = getClientIp(request);
        Bucket bucket = cache.computeIfAbsent(ipAddress, k -> Bucket4j.builder().addLimit(limit).build());

        // Try to consume one token from the bucket
        if (bucket.tryConsume(1)) {
            log.debug("Request from IP {} processed. Tokens remaining: {}", ipAddress, bucket.getAvailableTokens());
            return true;
        } else {
            log.warn("Rate limit exceeded for IP: {}", ipAddress);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", String.valueOf(bucket.getEstimationParameters().get().getNanosToWaitForRefill() / 1_000_000_000));
            throw new TooManyRequestsException("You have exhausted your API request quota. Please try again later.");
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || !xfHeader.contains(".")) {
            return request.getRemoteAddr();
        }
        // If multiple IPs are forwarded, the first one is usually the client's IP
        return xfHeader.split(",")[0];
    }
}
```