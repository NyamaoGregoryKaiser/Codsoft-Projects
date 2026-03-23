```java
package com.tasksyncpro.tasksyncpro.config;

import com.github.ben_manes.caffeine.cache.Caffeine;
import com.tasksyncpro.tasksyncpro.service.MetricsService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching
@RequiredArgsConstructor
public class CacheConfig {

    private final MetricsService metricsService; // Inject MetricsService

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(caffeineCacheBuilder());
        return cacheManager;
    }

    Caffeine<Object, Object> caffeineCacheBuilder() {
        return Caffeine.newBuilder()
                .initialCapacity(100)
                .maximumSize(500)
                .expireAfterAccess(10, TimeUnit.MINUTES)
                .recordStats() // Enable stats recording for Micrometer
                .removalListener((key, value, cause) ->
                        System.out.println("Cache entry removed: " + key + " due to " + cause))
                .writer(new com.github.ben_manes.caffeine.cache.CacheWriter<>() {
                    @Override
                    public void write(Object key, Object value) {
                        // Not used for read-through cache, but useful for write-through.
                    }

                    @Override
                    public void delete(Object key, Object value, com.github.ben_manes.caffeine.cache.RemovalCause cause) {
                        // Optional: Perform actions when an entry is evicted/deleted
                        // e.g., log, update external system
                    }
                });
    }

    // Expose Caffeine's cache statistics to Micrometer
    @Bean
    public io.micrometer.core.instrument.binder.cache.CacheMetricsRegistrar cacheMetricsRegistrar(CacheManager cacheManager) {
        // This will automatically register metrics for all Caffeine caches managed by the CaffeineCacheManager
        return new io.micrometer.core.instrument.binder.cache.CacheMetricsRegistrar(
                cacheManager, metricsService.getMeterRegistry(), caches -> caches.forEach(cache -> {
            if (cache.getNativeCache() instanceof com.github.ben_manes.caffeine.cache.Cache) {
                com.github.ben_manes.caffeine.cache.Cache caffeineCache = (com.github.ben_manes.caffeine.cache.Cache) cache.getNativeCache();
                // Custom handling to tie Caffeine stats to our MetricsService if needed,
                // otherwise Micrometer's CacheMetricsRegistrar does a good job by default.
                // For demonstrating, we can increment our custom counters from here
                caffeineCache.stats(); // Access stats to ensure they are being recorded
                // However, Micrometer itself binds the cache stats, no need to manually increment our counters here
                // The CacheMetricsRegistrar takes care of binding hit/miss/eviction metrics.
            }
        }));
    }
}
```