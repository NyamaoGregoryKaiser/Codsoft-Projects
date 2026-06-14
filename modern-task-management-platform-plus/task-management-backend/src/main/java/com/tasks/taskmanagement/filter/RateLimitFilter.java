```java
package com.tasks.taskmanagement.filter;

import com.google.common.cache.CacheBuilder;
import com.google.common.cache.CacheLoader;
import com.google.common.cache.LoadingCache;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Bucket4j;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Component
@Order(1) // Ensure this filter runs before JWT authentication filter
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    @Value("${rate-limit.enabled:true}")
    private boolean rateLimitEnabled;

    @Value("${rate-limit.limit:100}") // Max requests
    private int limit;

    @Value("${rate-limit.duration:60000}") // In milliseconds (60 seconds)
    private long duration;

    private LoadingCache<String, Bucket> buckets;

    public RateLimitFilter(@Value("${rate-limit.limit:100}") int limit, @Value("${rate-limit.duration:60000}") long duration) {
        this.limit = limit;
        this.duration = duration;
        initBucketCache();
    }

    private void initBucketCache() {
        buckets = CacheBuilder.newBuilder()
                .maximumSize(1000) // Max 1000 IP addresses in cache
                .expireAfterAccess(Duration.ofMillis(duration * 2)) // Clear buckets after 2x duration of inactivity
                .build(new CacheLoader<String, Bucket>() {
                    @Override
                    public Bucket load(String key) {
                        return createNewBucket();
                    }
                });
    }

    private Bucket createNewBucket() {
        // Refill `limit` tokens every `duration` milliseconds
        Refill refill = Refill.intervally(limit, Duration.ofMillis(duration));
        Bandwidth limitBandwidth = Bandwidth.classic(limit, refill);
        return Bucket4j.builder().addLimit(limitBandwidth).build();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if (!rateLimitEnabled) {
            filterChain.doFilter(request, response);
            return;
        }

        String ipAddress = getClientIpAddress(request);
        Bucket bucket = buckets.getUnchecked(ipAddress); // Get or create bucket for IP

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            log.warn("Rate limit exceeded for IP: {}", ipAddress);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.getWriter().write("Too many requests.");
            response.setHeader("Retry-After", String.valueOf(TimeUnit.MILLISECONDS.toSeconds(duration))); // Indicate when to retry
        }
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedForHeader = request.getHeader("X-Forwarded-For");
        if (xForwardedForHeader != null && !xForwardedForHeader.isEmpty()) {
            return xForwardedForHeader.split(",")[0].trim(); // Take the first IP in case of multiple proxies
        }
        return request.getRemoteAddr();
    }
}
```