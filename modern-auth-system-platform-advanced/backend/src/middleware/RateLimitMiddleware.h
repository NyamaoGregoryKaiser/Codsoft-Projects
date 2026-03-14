#ifndef AUTH_SYSTEM_RATELIMITMIDDLEWARE_H
#define AUTH_SYSTEM_RATELIMITMIDDLEWARE_H

#include <pistache/router.h>
#include <pistache/http.h>
#include <chrono>
#include <map>
#include <mutex>
#include "../config/Config.h"
#include "../logger/Logger.h"
#include "../exceptions/AuthException.h" // Re-using AuthException for a generic BadRequest type

namespace Middleware {

    // Simple in-memory rate limiting based on IP address
    class RateLimiter {
    public:
        RateLimiter() : maxRequests(Config::getRateLimitMaxRequests()), windowSeconds(Config::getRateLimitWindowSeconds()) {
            Logger::getLogger()->info("Rate limiter initialized: {} requests per {} seconds.", maxRequests, windowSeconds);
        }

        bool allowRequest(const std::string& ipAddress) {
            std::lock_guard<std::mutex> lock(mtx);
            auto now = std::chrono::steady_clock::now();
            auto windowStart = now - std::chrono::seconds(windowSeconds);

            // Remove old requests from the list for this IP
            auto& requests = ipRequestTimestamps[ipAddress];
            while (!requests.empty() && requests.front() < windowStart) {
                requests.pop_front();
            }

            if (requests.size() < maxRequests) {
                requests.push_back(now);
                return true;
            } else {
                return false; // Too many requests
            }
        }

    private:
        std::map<std::string, std::deque<std::chrono::steady_clock::time_point>> ipRequestTimestamps;
        std::mutex mtx;
        const int maxRequests;
        const int windowSeconds;
    };

    inline RateLimiter globalRateLimiter; // Global instance

    inline void rateLimit(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response, std::function<void(const Pistache::Rest::Request&, Pistache::Http::ResponseWriter)> next) {
        std::string ipAddress = request.address().host(); // Get client IP

        if (!globalRateLimiter.allowRequest(ipAddress)) {
            Logger::getLogger()->warn("Rate limit exceeded for IP: {}", ipAddress);
            response.headers().add<Pistache::Http::Header::Custom>("Retry-After", std::to_string(Config::getRateLimitWindowSeconds()));
            throw AuthException(AuthErrorType::BadRequest, "Too Many Requests. Please try again later.");
        }

        next(request, response);
    }

} // namespace Middleware

#endif // AUTH_SYSTEM_RATELIMITMIDDLEWARE_H