#pragma once

#include <chrono>
#include <unordered_map>
#include <string>
#include <mutex>

namespace Utils {

// Implements a simple token bucket rate limiter
class RateLimiter {
public:
    RateLimiter(int max_requests, int window_seconds)
        : max_requests_(max_requests), window_seconds_(window_seconds) {}

    bool allowRequest(const std::string& key) {
        std::lock_guard<std::mutex> lock(mtx_);
        
        auto now = std::chrono::steady_clock::now();
        auto& bucket = buckets_[key];

        // Refill tokens
        if (bucket.last_refill_time.time_since_epoch().count() == 0) {
            bucket.tokens = max_requests_;
        } else {
            auto elapsed_time = std::chrono::duration_cast<std::chrono::seconds>(now - bucket.last_refill_time).count();
            if (elapsed_time > 0) {
                bucket.tokens = std::min(max_requests_, bucket.tokens + (int)(elapsed_time * max_requests_ / window_seconds_));
            }
        }
        bucket.last_refill_time = now;

        // Consume token
        if (bucket.tokens >= 1) {
            bucket.tokens--;
            return true;
        }
        return false;
    }

private:
    struct Bucket {
        int tokens;
        std::chrono::steady_clock::time_point last_refill_time;
        Bucket() : tokens(0) {}
    };

    int max_requests_;
    int window_seconds_;
    std::unordered_map<std::string, Bucket> buckets_;
    std::mutex mtx_;
};

} // namespace Utils