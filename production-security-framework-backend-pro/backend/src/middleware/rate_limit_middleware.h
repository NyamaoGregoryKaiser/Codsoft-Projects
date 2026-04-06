#pragma once

#include <crow.h>
#include "../utils/rate_limiter.h"
#include "../utils/app_config.h"
#include "../utils/custom_exceptions.h"
#include "../utils/logger.h"

namespace Middleware {

struct RateLimit {
    struct context {}; // No specific context data needed

    Utils::RateLimiter limiter;
    bool enabled;

    RateLimit() : limiter(100, 60) { // Default values, overridden by config
        const auto& config = AppConfig::Config::getInstance();
        enabled = config.rate_limit_enabled;
        limiter = Utils::RateLimiter(config.rate_limit_max_requests, config.rate_limit_window_seconds);
        LOG_INFO("Rate Limiting: Enabled = {}, Max Requests = {}, Window = {}s",
                 enabled, config.rate_limit_max_requests, config.rate_limit_window_seconds);
    }

    void before_handle(crow::request& req, crow::response& res, context& ctx) {
        if (!enabled) {
            return;
        }

        // Use IP address as the key for rate limiting
        // For production, consider x-forwarded-for if behind proxy, or user ID after auth
        std::string ip_address = req.remote_ip_address;
        
        if (!limiter.allowRequest(ip_address)) {
            LOG_WARN("Rate limit exceeded for IP: {}", ip_address);
            throw CustomExceptions::TooManyRequestsException();
        }
    }

    void after_handle(crow::request& req, crow::response& res, context& ctx) {
        // Nothing to do after request
    }
};

} // namespace Middleware