```cpp
#pragma once

#include <drogon/HttpFilter.h>
#include <string>
#include <chrono>
#include <mutex>
#include <unordered_map>

// Extend drogon namespace for custom filter
namespace drogon
{
namespace filter
{
class RateLimitingMiddleware : public HttpFilter<RateLimitingMiddleware>
{
  public:
    RateLimitingMiddleware() = default;
    void doFilter(const HttpRequestPtr &req,
                  FilterCallback &&fcb,
                  FilterChainCallback &&fccb) override;

  private:
    struct RequestData {
        int count;
        std::chrono::time_point<std::chrono::steady_clock> windowStart;
    };

    std::unordered_map<std::string, RequestData> clientRequestCounts_;
    std::mutex mutex_;
};
} // namespace filter
} // namespace drogon
```