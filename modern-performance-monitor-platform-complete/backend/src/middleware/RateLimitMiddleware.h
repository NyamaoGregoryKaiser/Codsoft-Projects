```cpp
#ifndef PERFOMETRICS_RATELIMITMIDDLEWARE_H
#define PERFOMETRICS_RATELIMITMIDDLEWARE_H

#include "crow.h"
#include "../utils/Config.h"
#include "../utils/Logger.h"
#include <unordered_map>
#include <chrono>
#include <mutex>

namespace PerfoMetrics {

struct RateLimitMiddleware {
    struct RequestInfo {
        std::chrono::steady_clock::time_point first_request_time;
        int count;
    };

    std::unordered_map<std::string, RequestInfo> client_requests;
    std::mutex mtx;
    int max_requests;
    int window_seconds;

    RateLimitMiddleware() {
        Config::load();
        max_requests = Config::get_int("RATE_LIMIT_MAX_REQUESTS");
        window_seconds = Config::get_int("RATE_LIMIT_WINDOW_SECONDS");
        Logger::get_logger()->info("RateLimitMiddleware initialized: {} requests per {} seconds.", max_requests, window_seconds);
    }

    template <typename Next>
    void call(crow::request& req, crow::response& res, Next&& next) {
        std::string client_ip = req.get_header("X-Forwarded-For"); // Get real IP if behind proxy
        if (client_ip.empty()) {
            client_ip = req.remote_ip_address();
        }

        std::lock_guard<std::mutex> lock(mtx);

        auto now = std::chrono::steady_clock::now();
        auto it = client_requests.find(client_ip);

        if (it == client_requests.end()) {
            // First request from this IP
            client_requests[client_ip] = {now, 1};
        } else {
            // Check if window expired
            auto elapsed = std::chrono::duration_cast<std::chrono::seconds>(now - it->second.first_request_time).count();
            if (elapsed > window_seconds) {
                // Reset window
                it->second = {now, 1};
            } else {
                // Increment count within window
                it->second.count++;
                if (it->second.count > max_requests) {
                    Logger::get_logger()->warn("Rate limit exceeded for IP: {}", client_ip);
                    res.code = 429; // Too Many Requests
                    res.set_header("Retry-After", std::to_string(window_seconds - elapsed));
                    res.write({"error", "Rate limit exceeded. Please try again later."}.dump());
                    res.end();
                    return;
                }
            }
        }

        next(req, res);
    }
};

} // namespace PerfoMetrics

#endif //PERFOMETRICS_RATELIMITMIDDLEWARE_H
```