```cpp
#include "RateLimiter.h"
#include "core/utils/Logger.h"
#include "core/utils/Config.h"
#include <nlohmann/json.hpp>

using namespace Pistache;
using namespace nlohmann;

// Initialize static members
int RateLimiter::MAX_REQUESTS = Config::getInt("RATE_LIMIT_MAX_REQUESTS", 100);
std::chrono::seconds RateLimiter::TIME_WINDOW = std::chrono::seconds(Config::getInt("RATE_LIMIT_TIME_WINDOW_SECONDS", 60));
std::map<std::string, RequestInfo> RateLimiter::request_counts;
std::mutex RateLimiter::mutex;

void RateLimiter::limit(const Rest::Request& request, Http::ResponseWriter response) {
    std::string client_ip = request.address().host();

    std::lock_guard<std::mutex> guard(mutex);

    auto now = std::chrono::steady_clock::now();

    // Clean up old entries (simple cleanup, could be more efficient with a background job)
    for (auto it = request_counts.begin(); it != request_counts.end(); ) {
        if (now - it->second.first_request_time > TIME_WINDOW) {
            it = request_counts.erase(it);
        } else {
            ++it;
        }
    }

    auto it = request_counts.find(client_ip);
    if (it == request_counts.end()) {
        // First request from this IP
        request_counts[client_ip] = {1, now};
        // Logger::debug("RateLimiter: First request from {}", client_ip);
    } else {
        RequestInfo& info = it->second;
        if (now - info.first_request_time < TIME_WINDOW) {
            info.count++;
            if (info.count > MAX_REQUESTS) {
                Logger::warn("RateLimiter: IP {} exceeded rate limit ({} requests in {}s)", client_ip, info.count, TIME_WINDOW.count());
                response.send(Http::Code::Too_Many_Requests, json({{"message", "Too Many Requests"}}).dump());
                throw Rest::HttpError(Http::Code::Too_Many_Requests); // Stop processing request
            }
        } else {
            // Window expired, reset
            info.count = 1;
            info.first_request_time = now;
            // Logger::debug("RateLimiter: Reset count for {}", client_ip);
        }
    }
}
```