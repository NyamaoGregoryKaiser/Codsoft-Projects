```cpp
#pragma once

#include <string>
#include <vector>
#include <map>
#include <ctime>
#include <optional>

namespace mlops {

// Common types for model parameters and prediction data
using ModelParameters = std::map<std::string, double>; // Example: {"coef_x1": 0.5, "intercept": 1.2}
using PredictionInput = std::map<std::string, double>; // Example: {"feature_x1": 10.0, "feature_x2": 5.0}
using PredictionOutput = std::map<std::string, double>; // Example: {"predicted_value": 15.2}

enum class LogLevel {
    INFO,
    WARN,
    ERROR,
    DEBUG
};

// --- Data Transfer Objects (DTOs) for API and internal use ---

struct ModelDTO {
    std::optional<int> id;
    std::string name;
    std::string description;
    std::string created_at; // ISO 8601 format
    std::string updated_at; // ISO 8601 format
};

struct ModelVersionDTO {
    std::optional<int> id;
    int model_id;
    std::string version_tag;
    std::string model_path; // Path to the actual model file/data
    std::string created_at;
    bool is_active;
    ModelParameters parameters; // Store example parameters for dummy model
    std::string notes;
};

struct PredictionLogDTO {
    std::optional<int> id;
    int model_version_id;
    PredictionInput input_data;
    PredictionOutput output_data;
    std::string timestamp;
    std::string status; // e.g., "SUCCESS", "ERROR"
    std::string error_message; // if status is ERROR
};

// Utility function to get current timestamp in ISO 8601 format
inline std::string getCurrentTimestamp() {
    std::time_t t = std::time(nullptr);
    char buf[sizeof "2011-10-08T07:07:09Z"]; // Sufficient size for ISO 8601 UTC
    std::strftime(buf, sizeof buf, "%Y-%m-%dT%H:%M:%SZ", std::gmtime(&t));
    return buf;
}

} // namespace mlops
```