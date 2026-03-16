```cpp
#ifndef RATE_LIMITER_H
#define RATE_LIMITER_H

#include <pistache/http.h>
#include <pistache/router.h>
#include <chrono>
#include <map>
#include <string>
#include <mutex>

struct RequestInfo {
    int count;
    std::chrono::steady_clock::time_point first_request_time;
};

class RateLimiter {
public:
    static void limit(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response);

private:
    static int MAX_REQUESTS;       // Max requests allowed in the window
    static std::chrono::seconds TIME_WINDOW; // Time window in seconds

    // In-memory store for IP addresses and their request counts/times
    // For production, this would be replaced by Redis or a distributed cache.
    static std::map<std::string, RequestInfo> request_counts;
    static std::mutex mutex;

    RateLimiter() = delete; // Prevent instantiation
};

#endif // RATE_LIMITER_H
```