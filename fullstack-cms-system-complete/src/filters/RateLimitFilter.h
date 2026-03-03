```cpp
#pragma once

#include <drogon/HttpFilter.h>
#include <unordered_map>
#include <chrono>
#include <mutex>

namespace ApexContent::Filter {

struct RequestInfo {
    std::chrono::steady_clock::time_point firstRequestTime;
    int requestCount;
};

class RateLimitFilter : public drogon::HttpFilter<RateLimitFilter> {
public:
    RateLimitFilter() = default;
    void doFilter(const drogon::HttpRequestPtr& req,
                  drogon::FilterCallback &&fcb,
                  drogon::FilterChainCallback &&fccb) override;

private:
    std::unordered_map<std::string, RequestInfo> ipRequestCounts_;
    std::mutex mutex_;
    int maxRequests_;
    int windowSeconds_; // In seconds
};

} // namespace ApexContent::Filter
```