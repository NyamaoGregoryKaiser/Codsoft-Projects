package com.authsystem.config;

import com.authsystem.util.AppConstants;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Bucket4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class RateLimitingConfig {

    /**
     * Configures a rate-limiting bucket for authentication requests.
     * Allows 10 requests per minute for the login and register endpoints.
     */
    @Bean(name = AppConstants.AUTH_RATE_LIMIT_BUCKET)
    public Bucket authRateLimitBucket() {
        Bandwidth limit = Bandwidth.simple(10, Duration.ofMinutes(1)); // 10 requests per minute
        return Bucket4j.builder().addLimit(limit).build();
    }
}