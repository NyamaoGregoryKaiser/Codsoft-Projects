#pragma once

#include <string>
#include <chrono>
#include <nlohmann/json.hpp>

namespace DataVizPro {

struct Dashboard {
    std::string id;
    std::string user_id;
    std::string name;
    std::string description;
    nlohmann::json config; // Store dashboard layout, widget configurations, linked datasets
    std::chrono::system_clock::time_point created_at;
    std::chrono::system_clock::time_point updated_at;

    nlohmann::json toJson() const {
        nlohmann::json j;
        j["id"] = id;
        j["userId"] = user_id;
        j["name"] = name;
        j["description"] = description;
        j["config"] = config;
        j["createdAt"] = std::chrono::duration_cast<std::chrono::seconds>(created_at.time_since_epoch()).count();
        j["updatedAt"] = std::chrono::duration_cast<std::chrono::seconds>(updated_at.time_since_epoch()).count();
        return j;
    }
};

} // namespace DataVizPro
```