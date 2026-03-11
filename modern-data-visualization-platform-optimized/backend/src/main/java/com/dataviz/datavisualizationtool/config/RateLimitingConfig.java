package com.dataviz.datavisualizationtool.config;

import io.github.resilience4j.ratelimiter.RateLimiter;
import io.github.resilience4j.ratelimiter.RateLimiterConfig;
import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class RateLimitingConfig {

    public static final String DATA_FETCH_RATE_LIMITER = "dataFetchRateLimiter";

    @Bean
    public RateLimiterRegistry rateLimiterRegistry() {
        // Default configuration for rate limiters
        RateLimiterConfig config = RateLimiterConfig.custom()
                .limitRefreshPeriod(Duration.ofSeconds(1)) // Refresh period of 1 second
                .limitForPeriod(10) // 10 requests per second
                .timeoutDuration(Duration.ofSeconds(5)) // Wait up to 5 seconds for a permit
                .build();

        RateLimiterRegistry rateLimiterRegistry = RateLimiterRegistry.of(config);

        // Specific rate limiter for data fetching (e.g., more restrictive)
        RateLimiterConfig dataFetchConfig = RateLimiterConfig.custom()
                .limitRefreshPeriod(Duration.ofSeconds(10)) // 10 seconds refresh period
                .limitForPeriod(20) // 20 requests per 10 seconds (2 per second)
                .timeoutDuration(Duration.ofSeconds(2))
                .build();
        rateLimiterRegistry.rateLimiter(DATA_FETCH_RATE_LIMITER, dataFetchConfig);

        return rateLimiterRegistry;
    }

    @Bean
    public RateLimiter dataFetchRateLimiter(RateLimiterRegistry rateLimiterRegistry) {
        return rateLimiterRegistry.rateLimiter(DATA_FETCH_RATE_LIMITER);
    }
}