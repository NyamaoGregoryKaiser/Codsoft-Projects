```java
package com.taskflow.config;

import com.taskflow.util.LoggerInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final LoggerInterceptor loggerInterceptor;
    private final RateLimitingInterceptor rateLimitingInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Order matters: Rate Limiting should generally come before request logging
        registry.addInterceptor(rateLimitingInterceptor)
                .addPathPatterns("/api/**") // Apply to all API endpoints
                .excludePathPatterns("/api/auth/**", "/api/users/register"); // Exclude auth endpoints from rate limiting

        registry.addInterceptor(loggerInterceptor)
                .addPathPatterns("/**"); // Apply to all requests
    }
}
```