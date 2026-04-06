package com.example.ecommerce.api.config;

import com.github.ben_manes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager("products", "users"); // Define cache names
        cacheManager.setCaffeine(caffeineCacheBuilder());
        return cacheManager;
    }

    Caffeine<Object, Object> caffeineCacheBuilder() {
        return Caffeine.newBuilder()
                .initialCapacity(100) // Initial size of the cache
                .maximumSize(500)     // Maximum number of entries in the cache
                .expireAfterAccess(10, TimeUnit.MINUTES) // Entries expire 10 minutes after last access
                .weakKeys()          // Use weak references for keys
                .recordStats();      // Record cache statistics
    }
}