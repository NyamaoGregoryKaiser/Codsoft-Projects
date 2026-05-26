#pragma once

#include <string>
#include <chrono>
#include <nlohmann/json.hpp>

namespace DataVizPro {

struct Dataset {
    std::string id;
    std::string user_id;
    std::string name;
    std::string description;
    std::string file_path;
    nlohmann::json data_schema; // Store column names, types, etc.
    int row_count = 0;
    std::chrono::system_clock::time_point uploaded_at;

    nlohmann::json toJson() const {
        nlohmann::json j;
        j["id"] = id;
        j["userId"] = user_id;
        j["name"] = name;
        j["description"] = description;
        j["filePath"] = file_path; // For internal use, might not expose to frontend
        j["schema"] = data_schema;
        j["rowCount"] = row_count;
        j["uploadedAt"] = std::chrono::duration_cast<std::chrono::seconds>(uploaded_at.time_since_epoch()).count();
        return j;
    }
};

} // namespace DataVizPro
```