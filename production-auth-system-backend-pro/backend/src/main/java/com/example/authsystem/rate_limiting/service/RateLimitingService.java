```java
package com.example.authsystem.rate_limiting.service;

import com.example.authsystem.common.exception.RateLimitExceededException;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Bucket4j;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.grid.GridBucket;
import io.github.bucket4j.grid.GridBucketState;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManagerBuilder;
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

/**
 * Service for managing API rate limits using Bucket4j and Redis.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RateLimitingService {

    private final LettuceConnectionFactory lettuceConnectionFactory;

    private LettuceBasedProxyManager<String> proxyManager;
    private RedisClient redisClient;
    private StatefulRedisConnection<String, byte[]> connection;

    @Value("${rate-limiting.enabled:true}")
    private boolean rateLimitingEnabled;

    @Value("${rate-limiting.default-limit:100}")
    private long defaultLimit; // requests

    @Value("${rate-limiting.default-duration-seconds:60}")
    private long defaultDurationSeconds; // per duration

    // In-memory cache for buckets to avoid repeated Redis calls for hot keys
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        if (rateLimitingEnabled) {
            String redisUri = String.format("redis://%s:%d",
                    lettuceConnectionFactory.getHostName(),
                    lettuceConnectionFactory.getPort());
            redisClient = RedisClient.create(redisUri);
            connection = redisClient.connect(new RedisBucket4jCodec());

            proxyManager = LettuceBasedProxyManagerBuilder.builder()
                    .with=connection(connection)
                    .build();
            log.info("Rate limiting initialized with Redis at {}:{}", lettuceConnectionFactory.getHostName(), lettuceConnectionFactory.getPort());
        } else {
            log.info("Rate limiting is disabled.");
        }
    }

    @PreDestroy
    public void destroy() {
        if (connection != null) {
            connection.close();
        }
        if (redisClient != null) {
            redisClient.shutdown();
        }
    }

    /**
     * Attempts to consume a token from the bucket associated with the given key.
     * If rate limiting is disabled, it always allows the request.
     *
     * @param key The key to identify the bucket (e.g., user ID, IP address).
     * @param tokens The number of tokens to consume (usually 1).
     * @throws RateLimitExceededException If the rate limit is exceeded.
     */
    public void consumeToken(String key, long tokens) {
        if (!rateLimitingEnabled) {
            return;
        }

        Bucket bucket = getBucket(key);
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(tokens);

        if (!probe.isConsumed()) {
            long waitForRefill = probe.getNanosToWaitForRefill() / 1_000_000_000;
            String message = String.format("You have exceeded the rate limit. Try again in %d seconds.", waitForRefill);
            log.warn("Rate limit exceeded for key: {}. Try again in {} seconds.", key, waitForRefill);
            throw new RateLimitExceededException(message);
        }
        log.debug("Consumed {} token(s) for key: {}. Remaining: {}", tokens, key, probe.getRemainingTokens());
    }

    /**
     * Retrieves or creates a Bucket for the given key.
     * Uses Redis as the backing store for persistence across instances.
     */
    private Bucket getBucket(String key) {
        return buckets.computeIfAbsent(key, k -> {
            Supplier<GridBucketState> stateSupplier = () -> {
                Bandwidth limit = Bandwidth.simple(defaultLimit, Duration.ofSeconds(defaultDurationSeconds));
                return GridBucketState.create(limit);
            };
            return proxyManager.builder().build(key, stateSupplier);
        });
    }

    // Custom Redis codec for Bucket4j to work with byte[]
    private static class RedisBucket4jCodec implements io.lettuce.core.codec.RedisCodec<String, byte[]> {
        @Override
        public String decodeKey(java.nio.ByteBuffer byteBuffer) {
            return io.lettuce.core.codec.StringCodec.UTF8.decodeKey(byteBuffer);
        }

        @Override
        public byte[] decodeValue(java.nio.ByteBuffer byteBuffer) {
            return io.lettuce.core.codec.ByteArrayCodec.INSTANCE.decodeValue(byteBuffer);
        }

        @Override
        public java.nio.ByteBuffer encodeKey(String s) {
            return io.lettuce.core.codec.StringCodec.UTF8.encodeKey(s);
        }

        @Override
        public java.nio.ByteBuffer encodeValue(byte[] bytes) {
            return io.lettuce.core.codec.ByteArrayCodec.INSTANCE.encodeValue(bytes);
        }
    }
}
```