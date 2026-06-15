```cpp
#include "RateLimitingMiddleware.h"
#include "../utils/Logger.h"
#include "../config/AppConfig.h"
#include <drogon/HttpResponse.h>
#include <Poco/JSON/Object.h>

using namespace drogon;
using namespace drogon::filter;

void RateLimitingMiddleware::doFilter(const HttpRequestPtr &req,
                                      FilterCallback &&fcb,
                                      FilterChainCallback &&fccb) {
    auto& config = AppConfig::ConfigManager::getInstance().getRateLimitingConfig();

    if (!config.enabled) {
        fccb(); // Rate limiting is disabled, proceed
        return;
    }

    std::string clientIp = req->peerAddr().toIpPort(); // Get client IP address
    auto now = std::chrono::steady_clock::now();

    std::lock_guard<std::mutex> lock(mutex_);

    auto it = clientRequestCounts_.find(clientIp);
    if (it == clientRequestCounts_.end()) {
        // First request from this IP
        clientRequestCounts_[clientIp] = {1, now};
        LOG_TRACE << "RateLimiting: First request from " << clientIp;
        fccb();
        return;
    }

    RequestData& data = it->second;
    auto windowDuration = std::chrono::seconds(config.windowSeconds);

    if (now - data.windowStart > windowDuration) {
        // Window expired, reset count and start new window
        data.count = 1;
        data.windowStart = now;
        LOG_TRACE << "RateLimiting: Reset window for " << clientIp;
        fccb();
        return;
    }

    // Within current window
    if (data.count < config.maxRequests) {
        data.count++;
        LOG_TRACE << "RateLimiting: " << clientIp << " count: " << data.count;
        fccb();
        return;
    }

    // Rate limit exceeded
    LOG_WARN << "RateLimiting: Client " << clientIp << " exceeded rate limit of "
             << config.maxRequests << " requests in " << config.windowSeconds << " seconds.";
    auto resp = HttpResponse::newHttpResponse();
    resp->setStatusCode(k429TooManyRequests);
    resp->setContentTypeCode(CT_APPLICATION_JSON);
    Poco::JSON::Object errJson;
    errJson.set("error", "Too Many Requests");
    errJson.set("message", "You have exceeded the rate limit. Please try again later.");
    resp->addHeader("Retry-After", std::to_string(config.windowSeconds)); // Suggest retry after window seconds
    resp->setBody(errJson.toString());
    fcb(resp);
}
```