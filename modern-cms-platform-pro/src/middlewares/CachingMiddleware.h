#pragma once

#include <drogon/HttpFilter.h>
#include <drogon/HttpResponse.h>
#include <string>
#include <map>
#include <chrono>
#include <mutex>
#include <optional>

struct CacheEntry {
    drogon::HttpResponsePtr response;
    std::chrono::steady_clock::time_point expiryTime;
};

class CachingMiddleware : public drogon::HttpFilter<CachingMiddleware> {
public:
    CachingMiddleware();

    void doFilter(const drogon::HttpRequestPtr &req,
                  drogon::FilterCallback &&fcb,
                  drogon::FilterChainCallback &&fcc);

private:
    std::map<std::string, CacheEntry> cache;
    std::mutex mtx;
    bool enabled;
    int defaultTtlSeconds; // Time To Live
};