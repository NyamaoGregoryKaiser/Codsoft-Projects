#pragma once

#include <stdexcept>
#include <string>
#include <nlohmann/json.hpp>

namespace DataVizPro {

enum class ErrorCode {
    UNKNOWN_ERROR = 0,
    INVALID_INPUT = 1001,
    UNAUTHORIZED = 1002,
    FORBIDDEN = 1003,
    NOT_FOUND = 1004,
    DB_ERROR = 1005,
    DUPLICATE_ENTRY = 1006,
    INVALID_CREDENTIALS = 1007,
    BAD_REQUEST = 1008,
    SERVICE_UNAVAILABLE = 1009
};

class DataVizError : public std::runtime_error {
public:
    ErrorCode code;
    std::string details;
    int http_status;

    DataVizError(ErrorCode code, const std::string& message, const std::string& details = "", int http_status = 500)
        : std::runtime_error(message), code(code), details(details), http_status(http_status) {}

    nlohmann::json toJson() const {
        nlohmann::json j;
        j["error"] = {
            {"code", static_cast<int>(code)},
            {"message", what()},
            {"details", details.empty() ? "" : details}
        };
        return j;
    }
};

} // namespace DataVizPro
```