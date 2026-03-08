package com.example.authsystem.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
public class CacheConfig {

    public static final String USERS_CACHE = "usersCache";
    public static final String TASKS_CACHE = "tasksCache";

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(10, TimeUnit.MINUTES) // Items expire 10 minutes after write
                .maximumSize(1000) // Max 1000 items in cache
                .recordStats()); // Record cache statistics
        cacheManager.setCacheNames(java.util.Set.of(USERS_CACHE, TASKS_CACHE));
        return cacheManager;
    }
}