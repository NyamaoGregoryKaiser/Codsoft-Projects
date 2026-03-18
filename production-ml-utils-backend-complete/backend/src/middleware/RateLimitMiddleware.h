#pragma once

#include "crow.h"
#include <string>
#include <unordered_map>
#include <chrono>
#include <mutex>

struct RateLimitEntry {
    int count;
    std::chrono::steady_clock::time_point window_start;
};

struct RateLimitMiddleware {
    struct context {}; // No specific context data

    // Static rate limit storage for IP addresses
    static std::unordered_map<std::string, RateLimitEntry> ip_limits;
    static std::mutex ip_limits_mutex;

    void before_handle(crow::request& req, crow::response& res, context& ctx);
    void after_handle(crow::request& req, crow::response& res, context& ctx);
};
```