```cpp
#pragma once

#include <drogon/HttpFilter.h>
#include <chrono>
#include <string>
#include "../services/CacheService.h"
#include "../utils/Logger.h"
#include "../config/ConfigManager.h"
#include <json/json.h>

/**
 * @brief HTTP Filter for rate limiting requests.
 *
 * This filter uses Redis (via CacheService) to track request counts for each
 * client (identified by IP address) and limits the number of requests within
 * a specified time window.
 */
class RateLimitFilter : public drogon::HttpFilter<RateLimitFilter> {
public:
    RateLimitFilter() = default;

    /**
     * @brief Initializes the RateLimitFilter with global settings.
     * @param enabled Whether rate limiting is enabled.
     * @param windowSeconds The time window in seconds for rate limiting.
     * @param maxRequests The maximum number of requests allowed within the window.
     */
    static void init(bool enabled, int windowSeconds, int maxRequests);

    /**
     * @brief Filters incoming HTTP requests for rate limiting.
     *
     * Increments a counter in Redis for the client's IP address. If the count
     * exceeds the maximum allowed requests within the window, the request is
     * rejected with a 429 Too Many Requests status.
     *
     * @param req The HTTP request.
     * @param callback The callback function to send response.
     * @param fc The filter chain callback to continue processing.
     */
    void doFilter(const drogon::HttpRequestPtr& req,
                  drogon::FilterCallback&& callback,
                  drogon::FilterChainCallback&& fc);

private:
    static bool s_enabled;
    static int s_windowSeconds;
    static int s_maxRequests;
};
```