```java
package com.tasks.taskmanagement.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Configuration
public class CacheConfig {

    @Value("${spring.cache.caffeine.specs}")
    private String caffeineSpecs; // Format: "cacheName1:maximumSize=100,expireAfterWrite=60s;cacheName2:maximumSize=50,expireAfterWrite=300s"

    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager manager = new SimpleCacheManager();
        List<CaffeineCache> caches = Arrays.stream(caffeineSpecs.split(";"))
                .map(this::buildCaffeineCache)
                .collect(Collectors.toList());
        manager.setCaches(caches);
        return manager;
    }

    private CaffeineCache buildCaffeineCache(String cacheSpec) {
        String[] parts = cacheSpec.split(":");
        String cacheName = parts[0];
        String spec = parts.length > 1 ? parts[1] : "";

        long maximumSize = 100;
        long expireAfterWriteSeconds = 60; // Default 60 seconds

        if (!spec.isEmpty()) {
            String[] params = spec.split(",");
            for (String param : params) {
                if (param.startsWith("maximumSize=")) {
                    maximumSize = Long.parseLong(param.substring("maximumSize=".length()));
                } else if (param.startsWith("expireAfterWrite=")) {
                    String duration = param.substring("expireAfterWrite=".length());
                    if (duration.endsWith("s")) {
                        expireAfterWriteSeconds = Long.parseLong(duration.substring(0, duration.length() - 1));
                    } else if (duration.endsWith("m")) {
                        expireAfterWriteSeconds = Long.parseLong(duration.substring(0, duration.length() - 1)) * 60;
                    } else if (duration.endsWith("h")) {
                        expireAfterWriteSeconds = Long.parseLong(duration.substring(0, duration.length() - 1)) * 3600;
                    }
                }
            }
        }

        return new CaffeineCache(cacheName, Caffeine.newBuilder()
                .maximumSize(maximumSize)
                .expireAfterWrite(expireAfterWriteSeconds, TimeUnit.SECONDS)
                .build());
    }
}
```