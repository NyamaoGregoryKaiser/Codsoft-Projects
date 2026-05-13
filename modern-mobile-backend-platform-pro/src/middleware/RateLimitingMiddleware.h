```cpp
#pragma once

#include <drogon/drogon.h>
#include <drogon/HttpFilter.h>

namespace middleware
{
    /**
     * @brief Rate limiting middleware for Drogon.
     * Uses a simple in-memory token bucket algorithm based on IP address.
     * If the request exceeds the rate limit, it returns a 429 Too Many Requests response.
     */
    class RateLimitingMiddleware : public drogon::HttpFilter<RateLimitingMiddleware>
    {
    public:
        /**
         * @brief Filter method to apply rate limiting.
         * @param req The HTTP request.
         * @param callback The callback to send the response.
         * @param fc The filter chain to pass control to the next handler.
         */
        void doFilter(const drogon::HttpRequestPtr &req,
                      drogon::FilterCallback &&callback,
                      drogon::FilterChainCallback &&fc) override;
    };

} // namespace middleware
```