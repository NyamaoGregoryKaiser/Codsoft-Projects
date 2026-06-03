```java
package com.taskflow.util;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

import java.util.UUID;

@Component
@Slf4j
public class LoggerInterceptor implements HandlerInterceptor {

    private static final String REQUEST_ID_KEY = "requestId";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        MDC.put(REQUEST_ID_KEY, UUID.randomUUID().toString());
        long startTime = System.currentTimeMillis();
        request.setAttribute("startTime", startTime);
        log.info("Incoming Request: Method={}, URI={}", request.getMethod(), request.getRequestURI());
        return true;
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) {
        // Log basic info after handler execution but before view rendering
        // MDC is still available here
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        long startTime = (Long) request.getAttribute("startTime");
        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;
        String status = (ex != null) ? "ERROR" : String.valueOf(response.getStatus());

        log.info("Completed Request: Method={}, URI={}, Status={}, Duration={}ms",
                request.getMethod(), request.getRequestURI(), status, duration);

        MDC.remove(REQUEST_ID_KEY);
    }
}
```