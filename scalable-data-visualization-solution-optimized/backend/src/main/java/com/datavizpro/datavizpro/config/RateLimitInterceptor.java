package com.datavizpro.datavizpro.config;

import com.google.common.cache.CacheBuilder;
import com.google.common.cache.CacheLoader;
import com.google.common.cache.LoadingCache;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

@Component
@Slf4j
public class RateLimitInterceptor implements HandlerInterceptor {

    private final int MAX_REQUESTS_PER_SECOND = 10;
    private final LoadingCache<String, AtomicInteger> requestCounts;

    public RateLimitInterceptor() {
        requestCounts = CacheBuilder.newBuilder()
                .expireAfterWrite(1, TimeUnit.SECONDS) // Reset count every second
                .build(new CacheLoader<>() {
                    @Override
                    public AtomicInteger load(String key) {
                        return new AtomicInteger(0); // Initial count for an IP
                    }
                });
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String clientIp = getClientIp(request);
        AtomicInteger count = requestCounts.get(clientIp);

        if (count.incrementAndGet() > MAX_REQUESTS_PER_SECOND) {
            log.warn("Rate limit exceeded for IP: {}", clientIp);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.getWriter().write("Too many requests. Please try again later.");
            response.setHeader("Retry-After", "1"); // Suggest client to retry after 1 second
            return false;
        }
        return true;
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || !xfHeader.contains(".")) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0]; // Return first IP in chain
    }
}