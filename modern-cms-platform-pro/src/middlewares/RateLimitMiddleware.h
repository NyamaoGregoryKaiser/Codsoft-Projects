#pragma once

#include <drogon/HttpFilter.h>
#include <chrono>
#include <map>
#include <string>
#include <mutex>

struct RequestRecord {
    std::chrono::steady_clock::time_point firstRequestTime;
    int requestCount;
};

class RateLimitMiddleware : public drogon::HttpFilter<RateLimitMiddleware> {
public:
    RateLimitMiddleware();

    void doFilter(const drogon::HttpRequestPtr &req,
                  drogon::FilterCallback &&fcb,
                  drogon::FilterChainCallback &&fcc);

private:
    std::map<std::string, RequestRecord> ipRequests;
    std::mutex mtx;
    int maxRequests;
    int windowSeconds;
};