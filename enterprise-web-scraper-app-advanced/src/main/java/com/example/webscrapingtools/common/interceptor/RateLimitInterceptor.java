package com.example.webscrapingtools.common.interceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Component
@Slf4j
public class RateLimitInterceptor implements HandlerInterceptor {

    // Simple in-memory rate limiting: 5 requests per 10 seconds per IP
    private final Map<String, Long> lastAccessTime = new ConcurrentHashMap<>();
    private final Map<String, Integer> requestCounts = new ConcurrentHashMap<>();
    private final int MAX_REQUESTS = 5;
    private final long TIME_WINDOW_SECONDS = 10; // 10 seconds

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String clientIp = getClientIp(request);
        long currentTime = System.currentTimeMillis();

        lastAccessTime.putIfAbsent(clientIp, currentTime);
        requestCounts.putIfAbsent(clientIp, 0);

        long lastTime = lastAccessTime.get(clientIp);
        int currentCount = requestCounts.get(clientIp);

        if ((currentTime - lastTime) > TimeUnit.SECONDS.toMillis(TIME_WINDOW_SECONDS)) {
            // Reset count if time window passed
            lastAccessTime.put(clientIp, currentTime);
            requestCounts.put(clientIp, 1);
        } else {
            // Increment count within the window
            requestCounts.put(clientIp, currentCount + 1);
            if (currentCount >= MAX_REQUESTS) {
                log.warn("Rate limit exceeded for IP: {}", clientIp);
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.getWriter().write("You have exceeded the API rate limit. Please try again later.");
                return false;
            }
        }
        return true;
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || !xfHeader.contains(".")) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0]; // Return the first IP in the list
    }
}