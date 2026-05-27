#ifndef ML_UTILITIES_SYSTEM_LOGGING_MIDDLEWARE_HPP
#define ML_UTILITIES_SYSTEM_LOGGING_MIDDLEWARE_HPP

#include "crow.h"
#include "../utils/logger.hpp" // For our custom logger

/**
 * @brief Crow middleware for request logging.
 *
 * Logs incoming request details (method, path, IP, user ID if authenticated)
 * and outgoing response status.
 */
struct LoggingMiddleware {
    struct context {}; // No specific context data needed for this middleware

    /**
     * @brief Called before routing a request.
     * Logs request details.
     *
     * @param req The incoming HTTP request.
     * @param res The outgoing HTTP response.
     * @param ctx The middleware context (unused here).
     * @return True to continue processing, false to stop.
     */
    void before_handle(crow::request& req, crow::response& res, context& ctx) {
        // You can extract user info from AuthMiddleware context if it runs before this.
        // For simplicity, we just log basic request info here.
        LOG_INFO("REQ: {} {} from {}", req.method_string(), req.url, req.remote_ip_address);
        // You could also log headers, body, etc. for debugging purposes, but be cautious with sensitive data.
    }

    /**
     * @brief Called after a request has been handled by a route.
     * Logs response status.
     *
     * @param req The incoming HTTP request.
     * @param res The outgoing HTTP response.
     * @param ctx The middleware context (unused here).
     */
    void after_handle(crow::request& req, crow::response& res, context& ctx) {
        LOG_INFO("RES: {} {} {} {}", req.method_string(), req.url, res.code, crow::get_http_status_code_string(res.code));
    }
};

#endif // ML_UTILITIES_SYSTEM_LOGGING_MIDDLEWARE_HPP
```