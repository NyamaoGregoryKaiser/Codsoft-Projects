```cpp
#include "error_middleware.h"

namespace middleware {

ErrorMiddleware::ErrorMiddleware() {}

void ErrorMiddleware::before_handle(crow::request& /*req*/, crow::response& /*res*/, crow::context& /*ctx*/) {
    // No specific action before handle for now
}

void ErrorMiddleware::after_handle(crow::request& req, crow::response& res, crow::context& /*ctx*/) {
    // Check if the response was already ended by a previous middleware (e.g., AuthMiddleware)
    if (res.is_completed()) {
        return;
    }

    // This middleware primarily catches exceptions thrown during route handling
    // Crow's default error handling wraps exceptions, so this might be more about formatting
    // already set error responses or catching explicit throws during tests.
    // For a more robust global error handling, Crow needs custom exception handling.
    // In current Crow versions, exceptions inside handlers are typically caught by Crow's internal server error handler.
    // This middleware is more useful if we explicitly pass error objects or codes.

    if (res.code >= 400 && res.code < 600) {
        if (res.body.empty() && res.code != crow::NO_CONTENT) {
            std::string error_msg;
            switch (res.code) {
                case crow::BAD_REQUEST: error_msg = "Bad Request"; break;
                case crow::UNAUTHORIZED: error_msg = "Unauthorized"; break;
                case crow::FORBIDDEN: error_msg = "Forbidden"; break;
                case crow::NOT_FOUND: error_msg = "Not Found"; break;
                case crow::CONFLICT: error_msg = "Conflict"; break;
                case crow::INTERNAL_SERVER_ERROR: error_msg = "Internal Server Error"; break;
                case crow::NOT_IMPLEMENTED: error_msg = "Not Implemented"; break;
                case crow::SERVICE_UNAVAILABLE: error_msg = "Service Unavailable"; break;
                default: error_msg = "An error occurred"; break;
            }
            LOG_ERROR("HTTP Error {} for {}: {}", res.code, req.url, error_msg);
            res.write(to_json({{"error", error_msg}}).dump());
            res.set_header("Content-Type", "application/json");
        }
    }
}

} // namespace middleware
```