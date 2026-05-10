```cpp
#ifndef AUTH_SYSTEM_ERROR_HANDLING_MIDDLEWARE_H
#define AUTH_SYSTEM_ERROR_HANDLING_MIDDLEWARE_H

#include "crow.h"
#include "../utils/Logger.h"
#include "../utils/JsonUtils.h"
#include <exception>

// Custom exception base class for application-specific errors
class AppException : public std::runtime_error {
public:
    int http_status;
    std::string error_code;

    AppException(const std::string& message, int status = 500, const std::string& code = "internal_server_error")
        : std::runtime_error(message), http_status(status), error_code(code) {}
};

struct ErrorHandlingMiddleware {
    struct context {}; // No specific context data needed

    void before_handle(crow::request& req, crow::response& res, context& ctx) {
        // No action needed before handling
        (void)req; (void)res; (void)ctx;
    }

    void after_handle(crow::request& req, crow::response& res, context& ctx) {
        // Check if a response has already been sent
        if (res.code != 0 && res.body.empty() && res.status_message.empty()) {
             // This might indicate an unhandled error where the response object was not fully populated.
             // Or it's a 204 No Content which is fine.
             // For simplicity, we'll let the next step handle genuine errors if not yet explicitly set.
        }
    }

    // This is Crow's way of catching exceptions.
    // It's called when an exception propagates out of a route handler.
    void after_dispatch(crow::request& req, crow::response& res, context& ctx) {
        if (res.is_done()) {
            return; // Response already finalized (e.g., by another middleware or controller)
        }

        // Check for an exception that might have been stored or caught
        // Crow's exception handling can be tricky to intercept globally.
        // A common pattern is to wrap route logic in try/catch.
        // For this example, we'll ensure that our controllers explicitly use JsonUtils::sendError.
        // If an exception escapes a handler, Crow itself might catch it or it might crash the server.
        // This middleware acts more as a final fallback or a structured way to handle errors
        // that are explicitly thrown by `AppException`.

        if (res.code >= 400 && res.body.empty()) {
            // This could be a generic Crow error, let's make it structured
            JsonUtils::sendError(res, "server_error", "An unexpected error occurred on the server.", 500);
            LOG_ERROR("Request to %s %s resulted in an unhandled error (HTTP %d).", 
                      req.method_string().c_str(), req.url.c_str(), res.code);
            return;
        }

        // If the response code is 200 but body is empty for a non-204 request, something might be wrong
        if (res.code == 200 && res.body.empty() && req.method != crow::HTTPMethod::Options) {
             if (res.code != 204) { // 204 No Content is fine
                LOG_WARN("Request to %s %s returned 200 OK but with an empty body.", 
                         req.method_string().c_str(), req.url.c_str());
                // Optionally, force a server error or a default success message
             }
        }
    }
};

#endif // AUTH_SYSTEM_ERROR_HANDLING_MIDDLEWARE_H
```