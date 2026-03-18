#pragma once

#include <string>
#include "nlohmann/json.hpp"
#include "User.h" // For UUID generation

struct Model {
    std::string id;
    std::string user_id;
    std::string name;
    std::string description;
    std::string version;
    std::string model_path; // S3 path, local path, etc.
    std::string status;     // e.g., "draft", "training", "ready", "deployed"
    nlohmann::json metadata; // JSON object for additional arbitrary data
    std::string created_at;
    std::string updated_at;

    nlohmann::json toJson() const;
    static Model fromJson(const nlohmann::json& json);
};
```