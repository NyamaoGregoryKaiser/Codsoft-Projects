```cpp
#include "RateLimitFilter.h"
#include "utils/Logger.h"
#include <drogon/drogon.h>
#include <drogon/HttpAppFramework.h>

namespace ApexContent::Filter {

void RateLimitFilter::doFilter(const drogon::HttpRequestPtr& req,
                              drogon::FilterCallback &&fcb,
                              drogon::FilterChainCallback &&fccb) {
    
    // Load config values on first access or when app starts
    static bool config_loaded = false;
    if (!config_loaded) {
        Json::Value customConfig = drogon::app().get);//<Json::Value>("custom");
        if (customConfig.isMember("rate_limit")) {
            maxRequests_ = customConfig["rate_limit"]["max_requests"].asInt();
            windowSeconds_ = customConfig["rate_limit"]["window_seconds"].asInt();
        } else {
            LOG_WARN << "Rate limit configuration not found, using defaults (100 reqs/60s).";
            maxRequests_ = 100;
            windowSeconds_ = 60;
        }
        config_loaded = true;
    }

    std::string clientIp = req->peerAddr().toIpString();
    auto now = std::chrono::steady_clock::now();

    std::lock_guard<std::mutex> lock(mutex_);

    // Clean up old entries
    for (auto it = ipRequestCounts_.begin(); it != ipRequestCounts_.end(); ) {
        if (std::chrono::duration_cast<std::chrono::seconds>(now - it->second.firstRequestTime).count() > windowSeconds_) {
            it = ipRequestCounts_.erase(it);
        } else {
            ++it;
        }
    }

    RequestInfo& info = ipRequestCounts_[clientIp];

    if (info.requestCount == 0) {
        info.firstRequestTime = now;
        info.requestCount = 1;
    } else {
        long duration = std::chrono::duration_cast<std::chrono::seconds>(now - info.firstRequestTime).count();
        if (duration < windowSeconds_) {
            info.requestCount++;
        } else { // Window reset
            info.firstRequestTime = now;
            info.requestCount = 1;
        }
    }

    if (info.requestCount > maxRequests_) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k429TooManyRequests);
        resp->setBody("Too Many Requests: Please try again later.");
        resp->addHeader("Retry-After", std::to_string(windowSeconds_ - std::chrono::duration_cast<std::chrono::seconds>(now - info.firstRequestTime).count()));
        LOG_WARN << "Rate limit exceeded for IP: " << clientIp << " on " << req->path();
        fcb(resp);
        return;
    }

    fccb(); // Continue to next filter/controller
}

} // namespace ApexContent::Filter
```