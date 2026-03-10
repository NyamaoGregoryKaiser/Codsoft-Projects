```cpp
#pragma once

#include <crow.h>
#include "../utils/Logger.h"
#include <exception>
#include <string>

namespace mlops {
namespace api {

// Custom exception class for API-specific errors
class ApiException : public std::runtime_error {
public:
    enum class ErrorCode {
        BAD_REQUEST = 400,
        UNAUTHORIZED = 401,
        FORBIDDEN = 403,
        NOT_FOUND = 404,
        CONFLICT = 409,
        INTERNAL_SERVER_ERROR = 500
    };

    ApiException(ErrorCode code, const std::string& message)
        : std::runtime_error(message), code_(code) {}

    ErrorCode getCode() const { return code_; }

    crow::response toCrowResponse() const {
        crow::json::wvalue error_json;
        error_json["status"] = static_cast<int>(code_);
        error_json["error"] = toString(code_);
        error_json["message"] = what();
        return crow::response(static_cast<int>(code_), error_json.dump());
    }

private:
    ErrorCode code_;

    std::string toString(ErrorCode code) const {
        switch (code) {
            case ErrorCode::BAD_REQUEST: return "Bad Request";
            case ErrorCode::UNAUTHORIZED: return "Unauthorized";
            case ErrorCode::FORBIDDEN: return "Forbidden";
            case ErrorCode::NOT_FOUND: return "Not Found";
            case ErrorCode::CONFLICT: return "Conflict";
            case ErrorCode::INTERNAL_SERVER_ERROR: return "Internal Server Error";
            default: return "Unknown Error";
        }
    }
};

// Global error handling middleware for Crow
struct ErrorHandler {
    struct context {}; // Required for Crow middleware

    void before_handle(crow::request& /*req*/, crow::response& /*res*/, context& /*ctx*/) {
        // No action needed before handle, but required by Crow
    }

    void after_handle(crow::request& /*req*/, crow::response& res, context& /*ctx*/) {
        // If an exception was caught by Crow and handled, this might not fire for all cases.
        // It's primarily for errors that Crow's internal dispatch handles.
        // For custom exceptions, they should be caught in the APIController routes directly.
    }

    // Function to generate a Crow response from an exception
    static crow::response handleException(const std::exception& e) {
        if (const auto* api_e = dynamic_cast<const ApiException*>(&e)) {
            LOG_WARN("API Exception: " + std::string(api_e->what()));
            return api_e->toCrowResponse();
        } else {
            LOG_ERROR("Unhandled exception: " + std::string(e.what()));
            ApiException internal_error(ApiException::ErrorCode::INTERNAL_SERVER_ERROR, "An unexpected server error occurred: " + std::string(e.what()));
            return internal_error.toCrowResponse();
        }
    }
};

} // namespace api
} // namespace mlops
```