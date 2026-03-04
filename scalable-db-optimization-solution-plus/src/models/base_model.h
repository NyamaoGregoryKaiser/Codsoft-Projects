```cpp
#ifndef OPTIDB_BASE_MODEL_H
#define OPTIDB_BASE_MODEL_H

#include <string>
#include <chrono>
#include <nlohmann/json.hpp>

// Base class for all models
class BaseModel {
public:
    long id = 0; // Primary key, auto-incremented in DB
    std::chrono::system_clock::time_point created_at;
    std::chrono::system_clock::time_point updated_at;

    // Pure virtual function to convert model to JSON
    virtual nlohmann::json to_json() const = 0;

    // Pure virtual function to create model from JSON (or other source)
    // This is often implemented via static factory methods or constructors
    // For simplicity, we'll mainly use to_json() and direct parsing from DB results.
    // virtual void from_json(const nlohmann::json& j) = 0;

    virtual ~BaseModel() = default;
};

// Helper for converting time_point to ISO 8601 string
static std::string to_iso8601(const std::chrono::system_clock::time_point& tp) {
    std::time_t tt = std::chrono::system_clock::to_time_t(tp);
    char buf[sizeof "2011-10-08T07:07:09Z"];
    std::strftime(buf, sizeof buf, "%FT%TZ", std::gmtime(&tt));
    return buf;
}

#endif // OPTIDB_BASE_MODEL_H
```