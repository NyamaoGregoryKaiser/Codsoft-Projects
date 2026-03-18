#include "CacheMiddleware.h"
#include "config/AppConfig.h"
#include "spdlog/spdlog.h"

// Initialize static members
std::unordered_map<std::string, CacheEntry> CacheMiddleware::cache;
std::mutex CacheMiddleware::cache_mutex;

void CacheMiddleware::before_handle(crow::request& req, crow::response& res, context& ctx) {
    if (req.method == crow::HTTPMethod::GET) {
        std::string cache_key = generateCacheKey(req);
        std::lock_guard<std::mutex> lock(cache_mutex);

        auto it = cache.find(cache_key);
        if (it != cache.end()) {
            if (std::chrono::steady_clock::now() < it->second.expiry_time) {
                // Cache hit and not expired
                spdlog::debug("Cache hit for {}", cache_key);
                res.write(it->second.response_body);
                res.set_header("Content-Type", "application/json"); // Assuming JSON responses
                res.set_header("X-Cache", "HIT");
                res.end(); // Send cached response and stop processing
                return;
            } else {
                // Expired, remove from cache
                spdlog::debug("Cache expired for {}, removing.", cache_key);
                cache.erase(it);
            }
        }
        spdlog::debug("Cache miss for {}", cache_key);
    }
    // Store cache key in request context for after_handle to use
    req.add_context<std::string>(generateCacheKey(req));
}

void CacheMiddleware::after_handle(crow::request& req, crow::response& res, context& ctx) {
    // Only cache GET requests with 200 OK status
    if (req.method == crow::HTTPMethod::GET && res.code == crow::HTTPResponseCode::OK) {
        auto& cache_key_opt = req.get_context<std::string>();
        if (cache_key_opt.has_value()) {
            std::string cache_key = cache_key_opt.value();
            int cache_ttl = AppConfig::getInstance().getCacheTtlSeconds();

            std::lock_guard<std::mutex> lock(cache_mutex);
            cache[cache_key] = {
                res.body,
                std::chrono::steady_clock::now() + std::chrono::seconds(cache_ttl)
            };
            spdlog::debug("Cached response for {} with TTL {}s", cache_key, cache_ttl);
            res.set_header("X-Cache", "MISS"); // Indicate it was not a cache hit on first access
        }
    } else if (req.method != crow::HTTPMethod::GET && req.method != crow::HTTPMethod::HEAD) {
        // Invalidate cache for paths affected by POST, PUT, DELETE operations
        // This is a simplified invalidation: clearing all entries that match the URL path.
        // A more sophisticated cache would invalidate specific keys.
        std::string path_prefix = req.url; // e.g., /api/v1/models
        size_t param_pos = path_prefix.find("/<"); // Remove path parameters for generic invalidation
        if (param_pos != std::string::npos) {
            path_prefix = path_prefix.substr(0, param_pos);
        }

        std::lock_guard<std::mutex> lock(cache_mutex);
        std::vector<std::string> keys_to_remove;
        for (const auto& pair : cache) {
            if (pair.first.rfind(path_prefix, 0) == 0) { // Check if key starts with path_prefix
                keys_to_remove.push_back(pair.first);
            }
        }
        for (const auto& key : keys_to_remove) {
            cache.erase(key);
            spdlog::debug("Invalidated cache key: {}", key);
        }
        if (!keys_to_remove.empty()) {
             spdlog::info("Cache invalidated for path prefix: {}", path_prefix);
        }
    }
}

std::string CacheMiddleware::generateCacheKey(const crow::request& req) {
    // Combine URL and query parameters to form a unique key
    std::string key = req.url;
    if (!req.url_params.empty()) {
        key += "?";
        bool first = true;
        for (const auto& param : req.url_params) {
            if (!first) key += "&";
            key += param.first + "=" + param.second;
            first = false;
        }
    }
    return key;
}
```