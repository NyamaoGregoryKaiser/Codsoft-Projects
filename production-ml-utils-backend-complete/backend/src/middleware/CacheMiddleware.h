#pragma once

#include "crow.h"
#include <string>
#include <unordered_map>
#include <chrono>
#include <mutex>

// Cache entry struct
struct CacheEntry {
    std::string response_body;
    std::chrono::steady_clock::time_point expiry_time;
};

struct CacheMiddleware {
    struct context {}; // No specific context data

    // Static cache storage
    static std::unordered_map<std::string, CacheEntry> cache;
    static std::mutex cache_mutex;

    void before_handle(crow::request& req, crow::response& res, context& ctx);
    void after_handle(crow::request& req, crow::response& res, context& ctx);

private:
    std::string generateCacheKey(const crow::request& req);
    bool isCacheable(const crow::request& req, const crow::response& res);
};
```