#ifndef ML_UTILITIES_SYSTEM_RATELIMIT_MIDDLEWARE_HPP
#define ML_UTILITIES_SYSTEM_RATELIMIT_MIDDLEWARE_HPP

#include "crow.h"
#include "nlohmann/json.hpp"
#include "../config/config.hpp"
#include "../utils/logger.hpp"
#include "error_middleware.hpp" // For HttpError
#include <string>
#include <chrono>
#include <map>
#include <mutex>

/**
 * @brief Represents an entry for a client in the rate limiting cache.
 */
struct RateLimitEntry {
    int requests_count;
    std::chrono::steady_clock::time_point window_start;
};

/**
 * @brief Crow middleware for API rate limiting.
 *
 * Implements a simple sliding window counter for rate limiting based on IP address.
 * Configuration is loaded from `Config`.
 *
 * For production, a more robust distributed rate limiter (e.g., Redis-based) is recommended.
 */
struct RateLimitMiddleware {
    struct context {}; // No specific context data needed for this middleware

    static bool is_enabled;
    static int max_requests;
    static int window_seconds;
    static std::map<std::string, RateLimitEntry> client_rates; // Maps IP address to rate limit data
    static std::mutex rate_limit_mutex;
    static bool initialized;

    /**
     * @brief Initializes the RateLimitMiddleware from configuration.
     * This must be called before the Crow app runs.
     */
    static void init() {
        if (initialized) {
            LOG_WARN("RateLimitMiddleware already initialized. Skipping re-initialization.");
            return;
        }

        try {
            is_enabled = (Config::get("RATE_LIMIT_ENABLED", "false") == "true");
            if (is_enabled) {
                max_requests = std::stoi(Config::get("RATE_LIMIT_MAX_REQUESTS", "100"));
                window_seconds = std::stoi(Config::get("RATE_LIMIT_WINDOW_SECONDS", "60"));
                if (max_requests <= 0 || window_seconds <= 0) {
                    LOG_ERROR("Invalid rate limit configuration: max_requests or window_seconds must be positive. Disabling rate limiting.");
                    is_enabled = false;
                } else {
                    LOG_INFO("Rate limiting enabled: {} requests per {} seconds.", max_requests, window_seconds);
                }
            } else {
                LOG_INFO("Rate limiting disabled.");
            }
        } catch (const std::exception& e) {
            LOG_CRITICAL("Failed to initialize RateLimitMiddleware from config: {}. Disabling rate limiting.", e.what());
            is_enabled = false;
        }
        initialized = true;
    }

    /**
     * @brief Called before routing a request to apply rate limiting.
     *
     * @param req The incoming HTTP request.
     * @param res The outgoing HTTP response.
     * @param ctx The middleware context (unused here).
     */
    void before_handle(crow::request& req, crow::response& res, context& ctx) {
        // Ensure initialization. This is a fallback if init() isn't called explicitly.
        if (!initialized) {
            init();
        }

        if (!is_enabled) {
            return; // Rate limiting is disabled
        }

        // Use remote IP address for rate limiting
        std::string client_ip = req.remote_ip_address;
        auto now = std::chrono::steady_clock::now();

        std::lock_guard<std::mutex> lock(rate_limit_mutex);

        auto it = client_rates.find(client_ip);
        if (it == client_rates.end()) {
            // First request from this IP
            client_rates[client_ip] = {1, now};
            LOG_DEBUG("RateLimit: New client IP '{}', count 1.", client_ip);
        } else {
            RateLimitEntry& entry = it->second;
            auto elapsed_time = std::chrono::duration_cast<std::chrono::seconds>(now - entry.window_start).count();

            if (elapsed_time >= window_seconds) {
                // Window expired, reset counter
                entry.requests_count = 1;
                entry.window_start = now;
                LOG_DEBUG("RateLimit: Client IP '{}', window reset, count 1.", client_ip);
            } else {
                // Within window
                entry.requests_count++;
                if (entry.requests_count > max_requests) {
                    // Rate limit exceeded
                    LOG_WARN("RateLimit: Client IP '{}' exceeded rate limit ({} requests in {}s).",
                             client_ip, entry.requests_count - 1, elapsed_time);
                    throw HttpError(crow::TOO_MANY_REQUESTS, "Too many requests. Please try again later.");
                }
                 LOG_DEBUG("RateLimit: Client IP '{}', count {}.", client_ip, entry.requests_count);
            }
        }
    }

    /**
     * @brief No-op after request handling.
     */
    void after_handle(crow::request& req, crow::response& res, context& ctx) {
        (void)req;
        (void)res;
        (void)ctx;
    }
};

// Static members initialization
bool RateLimitMiddleware::is_enabled = false;
int RateLimitMiddleware::max_requests = 0;
int RateLimitMiddleware::window_seconds = 0;
std::map<std::string, RateLimitEntry> RateLimitMiddleware::client_rates;
std::mutex RateLimitMiddleware::rate_limit_mutex;
bool RateLimitMiddleware::initialized = false;

#endif // ML_UTILITIES_SYSTEM_RATELIMIT_MIDDLEWARE_HPP
```