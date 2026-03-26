```cpp
#include "RateLimitFilter.h"

// Static member definitions
bool RateLimitFilter::s_enabled = true;
int RateLimitFilter::s_windowSeconds = 60;
int RateLimitFilter::s_maxRequests = 100;

void RateLimitFilter::init(bool enabled, int windowSeconds, int maxRequests) {
    s_enabled = enabled;
    s_windowSeconds = windowSeconds;
    s_maxRequests = maxRequests;
    LOG_INFO("RateLimitFilter initialized: Enabled={}, Window={}s, MaxRequests={}", enabled, windowSeconds, maxRequests);
}

void RateLimitFilter::doFilter(const drogon::HttpRequestPtr& req,
                              drogon::FilterCallback&& callback,
                              drogon::FilterChainCallback&& fc) {
    if (!s_enabled) {
        fc(); // Skip rate limiting if disabled
        return;
    }

    std::string clientIp = req->peerAddr().toIpString();
    std::string rateLimitKey = "ratelimit:" + clientIp;

    // Use Redis to increment the counter
    // INCR will return 1 if key is new, also set EXPIRE if new
    auto currentRequests = CacheService::incr(rateLimitKey, 1, s_windowSeconds);

    if (!currentRequests) {
        LOG_ERROR("RateLimitFilter: Failed to get/increment Redis counter for IP: {}. Proceeding without rate limit.", clientIp);
        fc(); // Fail-open: if Redis is down, don't block requests
        return;
    }

    long remainingRequests = s_maxRequests - currentRequests.value();
    long resetTime = std::chrono::duration_cast<std::chrono::seconds>(
        std::chrono::system_clock::now().time_since_epoch() + std::chrono::seconds(s_windowSeconds)
    ).count(); // Approximate reset time

    // Add rate limit headers
    req->addHeader("X-RateLimit-Limit", std::to_string(s_maxRequests));
    req->addHeader("X-RateLimit-Remaining", std::to_string(std::max(0L, remainingRequests)));
    req->addHeader("X-RateLimit-Reset", std::to_string(resetTime));

    if (currentRequests.value() > s_maxRequests) {
        LOG_WARN("RateLimitFilter: Too many requests from IP: {}. Current: {}, Max: {}.", clientIp, currentRequests.value(), s_maxRequests);
        Json::Value err;
        err["code"] = 429;
        err["message"] = "Too Many Requests. Please try again after " + std::to_string(s_windowSeconds) + " seconds.";
        auto resp = drogon::HttpResponse::newHttpJsonResponse(err);
        resp->setStatusCode(drogon::k429TooManyRequests);
        resp->addHeader("Retry-After", std::to_string(s_windowSeconds)); // Inform client when to retry
        callback(resp);
        return;
    }

    fc(); // Continue to next filter or controller
}
```