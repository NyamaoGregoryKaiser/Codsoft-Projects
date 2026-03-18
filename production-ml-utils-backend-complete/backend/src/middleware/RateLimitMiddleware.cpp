#include "RateLimitMiddleware.h"
#include "config/AppConfig.h"
#include "common/JsonUtils.h"
#include "spdlog/spdlog.h"

// Initialize static members
std::unordered_map<std::string, RateLimitEntry> RateLimitMiddleware::ip_limits;
std::mutex RateLimitMiddleware::ip_limits_mutex;

void RateLimitMiddleware::before_handle(crow::request& req, crow::response& res, context& ctx) {
    std::string ip_address = req.remote_ip_address;
    int max_requests = AppConfig::getInstance().getRateLimitRequests();
    int window_seconds = AppConfig::getInstance().getRateLimitWindowSeconds();

    std::lock_guard<std::mutex> lock(ip_limits_mutex);

    auto now = std::chrono::steady_clock::now();
    auto it = ip_limits.find(ip_address);

    if (it == ip_limits.end()) {
        // First request from this IP
        ip_limits[ip_address] = {1, now};
    } else {
        // Existing IP
        RateLimitEntry& entry = it->second;
        auto elapsed_time = std::chrono::duration_cast<std::chrono::seconds>(now - entry.window_start).count();

        if (elapsed_time >= window_seconds) {
            // Reset window
            entry.count = 1;
            entry.window_start = now;
        } else {
            // Increment count within window
            entry.count++;
            if (entry.count > max_requests) {
                spdlog::warn("Rate limit exceeded for IP: {}", ip_address);
                JsonUtils::sendErrorResponse(res, crow::HTTPResponseCode::TooManyRequests, "Too many requests. Please try again later.");
                res.set_header("Retry-After", std::to_string(window_seconds - elapsed_time));
                res.end();
                return; // Stop further processing
            }
        }
    }
    // Add rate limit headers to response (optional but good practice)
    res.set_header("X-RateLimit-Limit", std::to_string(max_requests));
    res.set_header("X-RateLimit-Remaining", std::to_string(max_requests - ip_limits[ip_address].count));
    res.set_header("X-RateLimit-Reset", std::to_string(std::chrono::duration_cast<std::chrono::seconds>(
        ip_limits[ip_address].window_start + std::chrono::seconds(window_seconds) - now
    ).count()));
}

void RateLimitMiddleware::after_handle(crow::request& req, crow::response& res, context& ctx) {
    // No specific action needed after handle for rate limiting
}
```