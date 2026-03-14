#include "CachingMiddleware.h"
#include <drogon/drogon.h>

CachingMiddleware::CachingMiddleware() {
    const auto& cacheConfig = drogon::app().getJsonValue("cache");
    if (cacheConfig.isObject()) {
        enabled = cacheConfig["enabled"].asBool();
        defaultTtlSeconds = cacheConfig["default_ttl_seconds"].asInt();
    } else {
        LOG_WARN << "Cache configuration not found or invalid. Using defaults: enabled=false, ttl=300s.";
        enabled = false;
        defaultTtlSeconds = 300;
    }
}

void CachingMiddleware::doFilter(const drogon::HttpRequestPtr &req,
                                droron::FilterCallback &&fcb,
                                drogon::FilterChainCallback &&fcc) {
    if (!enabled || req->method() != drogon::HttpMethod::Get) {
        fcc(); // Skip caching for non-GET requests or if disabled
        return;
    }

    std::string cacheKey = req->path() + req->getQuery();
    auto now = std::chrono::steady_clock::now();

    {
        std::lock_guard<std::mutex> lock(mtx);
        auto it = cache.find(cacheKey);
        if (it != cache.end()) {
            if (now < it->second.expiryTime) {
                // Cache hit and not expired
                LOG_DEBUG << "CachingMiddleware: Cache hit for " << cacheKey;
                fcb(it->second.response->clone()); // Return a clone to avoid modification
                return;
            } else {
                // Cache expired, remove it
                LOG_DEBUG << "CachingMiddleware: Cache expired for " << cacheKey;
                cache.erase(it);
            }
        }
    }

    // Cache miss or expired, proceed to handler and then cache response
    fcc([this, fcb, cacheKey, now](const drogon::HttpResponsePtr &response) {
        if (response->statusCode() == drogon::HttpStatusCode::k200OK) {
            std::lock_guard<std::mutex> lock(mtx);
            // Cache the response
            cache[cacheKey] = {response->clone(), now + std::chrono::seconds(defaultTtlSeconds)};
            LOG_DEBUG << "CachingMiddleware: Response cached for " << cacheKey;
        }
        fcb(response); // Send the response to the client
    });
}