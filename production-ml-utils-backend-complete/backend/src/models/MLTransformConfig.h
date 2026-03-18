#pragma once

#include <vector>
#include <string>
#include "nlohmann/json.hpp"

// Forward declaration for the data structure used in transformations
struct TransformData {
    std::vector<std::vector<double>> features; // 2D vector for features
    std::vector<std::string> feature_names;    // Column names

    nlohmann::json toJson() const;
    static TransformData fromJson(const nlohmann::json& json);
};
```