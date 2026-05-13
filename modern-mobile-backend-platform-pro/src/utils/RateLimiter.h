```cpp
#pragma once

#include <chrono>
#include <map>
#include <mutex>
#include <string>

namespace utils
{
    /**
     * @brief A simple in-memory rate limiter using a token bucket algorithm.
     * This implementation is thread-safe. Each key (e.g., IP address or user ID)
     * gets its own token bucket.
     * For production, a distributed rate limiter (e.g., Redis-backed) is often preferred.
     */
    class RateLimiter
    {
    public:
        // Delete copy constructor and assignment operator for Singleton pattern
        RateLimiter(const RateLimiter &) = delete;
        RateLimiter &operator=(const RateLimiter &) = delete;

        /**
         * @brief Get the singleton instance of the RateLimiter.
         * @return Reference to the RateLimiter instance.
         */
        static RateLimiter &getInstance();

        /**
         * @brief Attempts to consume a token for a given key.
         * @param key The unique identifier for the client (e.g., IP address, user ID).
         * @param tokensToConsume The number of tokens to consume (default is 1).
         * @return True if tokens were successfully consumed (request allowed), false otherwise.
         */
        bool tryConsume(const std::string &key, int tokensToConsume = 1);

        /**
         * @brief Checks if rate limiting is currently enabled based on configuration.
         * @return True if rate limiting is enabled, false otherwise.
         */
        bool isEnabled() const;

    private:
        RateLimiter(); // Private constructor for Singleton

        struct TokenBucket
        {
            double tokens; // Current number of tokens in the bucket
            std::chrono::steady_clock::time_point lastRefillTime; // Last time tokens were refilled
        };

        std::map<std::string, TokenBucket> buckets_;
        mutable std::mutex mutex_;

        bool enabled_;
        double bucketCapacity_; // Maximum tokens a bucket can hold
        double refillRatePerSecond_; // Tokens refilled per second

        /**
         * @brief Refills tokens for a given bucket based on elapsed time.
         * @param bucket The token bucket to refill.
         */
        void refillTokens(TokenBucket &bucket);
    };

} // namespace utils
```