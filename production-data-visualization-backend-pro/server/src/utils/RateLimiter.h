#pragma once

#include <chrono>
#include <unordered_map>
#include <mutex>

namespace DataVizPro {

class RateLimiter {
public:
    RateLimiter(size_t max_requests, std::chrono::seconds window_duration)
        : max_requests_(max_requests), window_duration_(window_duration) {}

    // Check if a request for 'key' should be allowed.
    // Returns true if allowed, false if rate-limited.
    bool allow(const std::string& key) {
        std::lock_guard<std::mutex> lock(mtx_);
        auto now = std::chrono::steady_clock::now();

        // Clean up expired requests
        request_timestamps_[key].erase(
            std::remove_if(request_timestamps_[key].begin(), request_timestamps_[key].end(),
                           [&](const auto& timestamp) {
                               return now - timestamp > window_duration_;
                           }),
            request_timestamps_[key].end()
        );

        if (request_timestamps_[key].size() < max_requests_) {
            request_timestamps_[key].push_back(now);
            return true;
        }
        return false; // Rate limited
    }

private:
    size_t max_requests_;
    std::chrono::seconds window_duration_;
    std::unordered_map<std::string, std::vector<std::chrono::steady_clock::time_point>> request_timestamps_;
    std::mutex mtx_;
};

} // namespace DataVizPro
```