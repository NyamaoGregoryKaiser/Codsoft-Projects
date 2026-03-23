```java
package com.tasksyncpro.tasksyncpro.interceptor;

import com.tasksyncpro.tasksyncpro.service.RateLimitService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitInterceptor implements HandlerInterceptor {

    private final RateLimitService rateLimitService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws IOException {
        String identifier;
        // Use authenticated username if available, otherwise fallback to IP address
        if (SecurityContextHolder.getContext().getAuthentication() != null &&
            SecurityContextHolder.getContext().getAuthentication().isAuthenticated() &&
            !"anonymousUser".equals(SecurityContextHolder.getContext().getAuthentication().getPrincipal())) {
            identifier = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        } else {
            identifier = request.getRemoteAddr();
            log.warn("Rate limiting unauthenticated request from IP: {}", identifier);
        }

        if (!rateLimitService.tryAcquire(identifier)) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.getWriter().write("Too many requests. Please try again later.");
            response.getWriter().flush();
            log.warn("Rate limit exceeded for identifier: {}", identifier);
            return false;
        }
        return true;
    }
}
```