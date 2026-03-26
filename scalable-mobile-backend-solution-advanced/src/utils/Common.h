```cpp
#pragma once

#include <string>
#include <chrono>
#include <stdexcept>
#include <json/json.h>

// Common utility functions and definitions

namespace Common {

    // Custom exception for API errors
    struct ApiException : public std::runtime_error {
        int statusCode;
        Json::Value errorBody; // More detailed error information if needed

        ApiException(int code, const std::string& message, const Json::Value& body = Json::Value())
            : std::runtime_error(message), statusCode(code), errorBody(body) {}
    };

    // Helper to convert std::string to std::chrono::system_clock::time_point
    // (This is a simplified example, real-world might use date/time libraries)
    inline std::chrono::system_clock::time_point stringToTimePoint(const std::string& timestamp) {
        // This is a very basic implementation, a robust solution would use a proper date parsing library
        // e.g., for "2023-10-27 10:30:00Z"
        // For simplicity, we assume Drogon's ORM returns time_point directly or provides a more convenient format.
        // Or for UUIDs:
        // trantor::Date date(timestamp);
        // return date.to and then to system_clock::time_point
        // For actual Drogon ORM generated models, it handles trantor::Date or similar.
        // For direct conversion of string timestamps, this requires more robust parsing.
        // Let's return epoch for now as a placeholder
        return std::chrono::system_clock::time_point();
    }

    // Helper to convert std::chrono::system_clock::time_point to std::string
    inline std::string timePointToString(const std::chrono::system_clock::time_point& tp) {
        auto in_time_t = std::chrono::system_clock::to_time_t(tp);
        std::stringstream ss;
        ss << std::put_time(std::gmtime(&in_time_t), "%Y-%m-%dT%H:%M:%SZ");
        return ss.str();
    }

    // Helper to check if a string is a valid UUID format
    inline bool isValidUUID(const std::string& uuid_str) {
        // Simple regex check for UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
        // This regex is basic and doesn't check for valid hex digits fully, just structure.
        // A more robust check might involve converting to a UUID type and checking validity.
        if (uuid_str.length() != 36) return false;
        if (uuid_str[8] != '-' || uuid_str[13] != '-' || uuid_str[18] != '-' || uuid_str[23] != '-') return false;
        return true; // Simplified for brevity
    }

} // namespace Common
```