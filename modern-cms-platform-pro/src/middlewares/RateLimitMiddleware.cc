#include "RateLimitMiddleware.h"
#include "utils/ApiResponse.h"
#include <drogon/drogon.h>

RateLimitMiddleware::RateLimitMiddleware() {
    const auto& rateLimitConfig = drogon::app().getJsonValue("rate_limit");
    if (rateLimitConfig.isObject()) {
        maxRequests = rateLimitConfig["max_requests"].asInt();
        windowSeconds = rateLimitConfig["window_seconds"].asInt();
    } else {
        LOG_WARN << "Rate limit configuration not found or invalid. Using defaults: 100 reqs/60s.";
        maxRequests = 100;
        windowSeconds = 60;
    }
}

void RateLimitMiddleware::doFilter(const drogon::HttpRequestPtr &req,
                                  drogon::FilterCallback &&fcb,
                                  drogon::FilterChainCallback &&fcc) {
    std::string clientIp = req->peerAddr().toIpString();
    std::lock_guard<std::mutex> lock(mtx);

    auto now = std::chrono::steady_clock::now();
    auto it = ipRequests.find(clientIp);

    if (it == ipRequests.end()) {
        // First request from this IP
        ipRequests[clientIp] = {now, 1};
        LOG_DEBUG << "RateLimitMiddleware: First request from " << clientIp;
        fcc();
    } else {
        RequestRecord& record = it->second;
        auto timeElapsed = std::chrono::duration_cast<std::chrono::seconds>(now - record.firstRequestTime).count();

        if (timeElapsed >= windowSeconds) {
            // Reset window
            record.firstRequestTime = now;
            record.requestCount = 1;
            LOG_DEBUG << "RateLimitMiddleware: Resetting rate limit for " << clientIp;
            fcc();
        } else {
            // Within window
            record.requestCount++;
            if (record.requestCount > maxRequests) {
                // Rate limit exceeded
                LOG_WARN << "RateLimitMiddleware: Rate limit exceeded for " << clientIp << ". Requests: " << record.requestCount;
                return fcb(ApiResponse::tooManyRequests("Too Many Requests. Please try again later."));
            } else {
                LOG_DEBUG << "RateLimitMiddleware: Request " << record.requestCount << " from " << clientIp;
                fcc();
            }
        }
    }
}