package com.example.secureprojectmanagement.config;

import com.github.ben_manes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;

import java.util.concurrent.TimeUnit;

@Configuration
public class CacheConfig {

    @Value("${spring.cache.caffeine.spec}")
    private String caffeineSpec;

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(Caffeine.from(caffeineSpec));
        return cacheManager;
    }
}