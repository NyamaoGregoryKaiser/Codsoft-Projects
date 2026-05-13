```cpp
#include "RateLimitingMiddleware.h"
#include "src/utils/RateLimiter.h"
#include "src/utils/Logger.h"
#include "src/exceptions/ApiException.h"

namespace middleware
{
    void RateLimitingMiddleware::doFilter(const drogon::HttpRequestPtr &req,
                                           drogon::FilterCallback &&callback,
                                           drogon::FilterChainCallback &&fc)
    {
        auto &rateLimiter = utils::RateLimiter::getInstance();

        if (!rateLimiter.isEnabled())
        {
            fc(); // If rate limiting is disabled, just proceed
            return;
        }

        std::string clientIp = req->peerAddr().toIpString(); // Get client IP address
        if (clientIp.empty()) {
            // Fallback for cases where IP might not be directly available or trusted proxy headers are used
            clientIp = req->getHeader("X-Forwarded-For");
            if (clientIp.empty()) {
                 clientIp = req->getHeader("X-Real-IP");
            }
            if (clientIp.empty()) {
                clientIp = "unknown-ip"; // Fallback to a generic identifier
                LOG_WARN("RateLimiting: Could not determine client IP for request {}", req->getPath());
            }
        }

        if (rateLimiter.tryConsume(clientIp))
        {
            fc(); // Request allowed
        }
        else
        {
            LOG_WARN("RateLimiting: Client '{}' exceeded rate limit for request {}", clientIp, req->getPath());
            throw api::ApiException("Too Many Requests. Please try again later.", drogon::k429TooManyRequests, "RATE_LIMIT_EXCEEDED");
        }
    }

} // namespace middleware
```