```java
package com.example.authsystem.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager("users"); // Define cache names
        cacheManager.setCaffeine(caffeineCacheBuilder());
        return cacheManager;
    }

    Caffeine<Object, Object> caffeineCacheBuilder() {
        return Caffeine.newBuilder()
                .initialCapacity(100) // Initial size of the cache
                .maximumSize(1000)   // Maximum number of entries in the cache
                .expireAfterAccess(10, TimeUnit.MINUTES) // Cache entry expires after 10 minutes of inactivity
                .weakKeys()          // Use weak references for keys
                .recordStats();      // Record cache statistics
    }
}
```