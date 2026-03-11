package com.dataviz.datavisualizationtool.config;

import com.github.ben_manes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
public class CacheConfig {

    public static final String DATA_SOURCE_CACHE = "dataSources";
    public static final String DASHBOARD_CACHE = "dashboards";
    public static final String VISUALIZATION_CACHE = "visualizations";

    @Bean
    public Caffeine<Object, Object> caffeineCacheBuilder() {
        return Caffeine.newBuilder()
                .expireAfterWrite(10, TimeUnit.MINUTES) // Cache entries expire after 10 minutes
                .maximumSize(1000); // Max 1000 entries
    }

    @Bean
    public CacheManager cacheManager(Caffeine<Object, Object> caffeine) {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(caffeine);
        // You can also define specific caches with different configurations here
        // cacheManager.registerCustomCache(DATA_SOURCE_CACHE, caffeineCacheBuilder().expireAfterWrite(5, TimeUnit.MINUTES).build());
        return cacheManager;
    }
}