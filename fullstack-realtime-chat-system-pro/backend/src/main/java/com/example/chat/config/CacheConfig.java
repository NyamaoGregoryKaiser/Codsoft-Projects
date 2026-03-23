package com.example.chat.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.concurrent.TimeUnit;

@Configuration
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager cacheManager = new SimpleCacheManager();
        cacheManager.setCaches(Arrays.asList(
                new CaffeineCache("chatRooms", Caffeine.newBuilder()
                        .maximumSize(100)
                        .expireAfterAccess(10, TimeUnit.MINUTES)
                        .build()),
                new CaffeineCache("users", Caffeine.newBuilder()
                        .maximumSize(500)
                        .expireAfterAccess(5, TimeUnit.MINUTES)
                        .build()),
                new CaffeineCache("messages", Caffeine.newBuilder() // Example for messages, though usually too dynamic
                        .maximumSize(1000)
                        .expireAfterWrite(1, TimeUnit.MINUTES)
                        .build())
        ));
        return cacheManager;
    }
}