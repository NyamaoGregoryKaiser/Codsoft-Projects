```cpp
#include "RateLimiter.h"
#include "Logger.h"
#include "AppConfig.h" // For reading rate limiting configuration

namespace utils
{
    RateLimiter::RateLimiter()
    {
        auto &config = AppConfig::getInstance();
        enabled_ = config.getBool("rateLimit.enabled", false);
        bucketCapacity_ = config.getInt("rateLimit.bucketCapacity", 100);
        refillRatePerSecond_ = config.getInt("rateLimit.bucketRefillRatePerSecond", 10);

        if (bucketCapacity_ <= 0) bucketCapacity_ = 100;
        if (refillRatePerSecond_ <= 0) refillRatePerSecond_ = 10;

        LOG_INFO("RateLimiter initialized. Enabled: {}, Capacity: {}, Refill Rate: {} tokens/sec.",
                 enabled_ ? "true" : "false", bucketCapacity_, refillRatePerSecond_);
    }

    RateLimiter &RateLimiter::getInstance()
    {
        static RateLimiter instance;
        return instance;
    }

    bool RateLimiter::tryConsume(const std::string &key, int tokensToConsume)
    {
        if (!enabled_)
        {
            return true; // If disabled, always allow
        }

        std::lock_guard<std::mutex> lock(mutex_);

        // Initialize bucket if it doesn't exist
        if (buckets_.find(key) == buckets_.end())
        {
            buckets_[key] = {bucketCapacity_, std::chrono::steady_clock::now()};
            LOG_DEBUG("RateLimiter: Initialized new bucket for key '{}'", key);
        }

        TokenBucket &bucket = buckets_[key];
        refillTokens(bucket); // Refill tokens before attempting to consume

        if (bucket.tokens >= tokensToConsume)
        {
            bucket.tokens -= tokensToConsume;
            LOG_DEBUG("RateLimiter: Key '{}' consumed {} tokens. Remaining: {}", key, tokensToConsume, bucket.tokens);
            return true;
        }
        else
        {
            LOG_WARN("RateLimiter: Key '{}' rate limited. Not enough tokens. Remaining: {}", key, bucket.tokens);
            return false;
        }
    }

    bool RateLimiter::isEnabled() const
    {
        return enabled_;
    }

    void RateLimiter::refillTokens(TokenBucket &bucket)
    {
        auto now = std::chrono::steady_clock::now();
        auto elapsedTime = std::chrono::duration_cast<std::chrono::nanoseconds>(now - bucket.lastRefillTime).count();

        if (elapsedTime > 0)
        {
            double tokensToAdd = refillRatePerSecond_ * (static_cast<double>(elapsedTime) / 1000000000.0);
            bucket.tokens = std::min(bucketCapacity_, bucket.tokens + tokensToAdd);
            bucket.lastRefillTime = now;
        }
    }

} // namespace utils
```