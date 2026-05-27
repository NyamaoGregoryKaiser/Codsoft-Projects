#ifndef ML_UTILITIES_SYSTEM_ERROR_MIDDLEWARE_HPP
#define ML_UTILITIES_SYSTEM_ERROR_MIDDLEWARE_HPP

#include "crow.h"
#include "nlohmann/json.hpp"
#include "../utils/logger.hpp"
#include <exception> // For std::exception
#include <stdexcept> // For std::runtime_error

/**
 * @brief Represents a custom HTTP error with a status code and message.
 */
struct HttpError : public std::runtime_error {
    crow::status http_status;
    std::string custom_message;

    explicit HttpError(crow::status status, const std::string& msg)
        : std::runtime_error(msg), http_status(status), custom_message(msg) {}

    HttpError(crow::status status, const char* msg)
        : std::runtime_error(msg), http_status(status), custom_message(msg) {}
};

/**
 * @brief Crow middleware for centralized error handling.
 *
 * Catches exceptions thrown during request processing and transforms them
 * into standardized JSON error responses.
 */
struct ErrorMiddleware {
    struct context {}; // No specific context data needed for this middleware

    /**
     * @brief This middleware doesn't need to do anything before handling the request.
     */
    void before_handle(crow::request& req, crow::response& res, context& ctx) {
        // No-op for before_handle
        (void)req; // Suppress unused parameter warning
        (void)res;
        (void)ctx;
    }

    /**
     * @brief Catches exceptions and forms an error response.
     * This method is implicitly called by Crow's exception handling mechanism
     * if the error handler is registered.
     *
     * In the `main.cpp`, we register `app.set_error_handler` which effectively
     * processes `crow::response` after an exception or manual error setting.
     * This `after_handle` is more for general post-processing.
     *
     * For explicit exception handling, Crow relies on `set_error_handler` or
     * `CROW_CATCHALL_ROUTE`. For this structure, we'll rely on our controllers
     * throwing `HttpError` and the `set_error_handler` in `main.cpp`
     * to catch and format the response correctly.
     *
     * This `after_handle` will primarily check if an error code was set
     * and log it, serving as a secondary error logging mechanism.
     */
    void after_handle(crow::request& req, crow::response& res, context& ctx) {
        if (res.code >= 400) {
            // An error has already occurred or been set in the response.
            // Ensure the response is JSON and log it.
            res.set_header("Content-Type", "application/json");
            // If the body is empty, populate it with a generic error
            if (res.body.empty()) {
                 res.body = nlohmann::json({
                    {"statusCode", res.code},
                    {"message", crow::get_http_status_code_string(res.code)}
                }).dump();
            }
            LOG_ERROR("HTTP Error Response for {}:{} - Status: {} ({}) - Body: {}",
                      req.method_string(), req.url, res.code, crow::get_http_status_code_string(res.code), res.body);
        }
    }
};

#endif // ML_UTILITIES_SYSTEM_ERROR_MIDDLEWARE_HPP
```