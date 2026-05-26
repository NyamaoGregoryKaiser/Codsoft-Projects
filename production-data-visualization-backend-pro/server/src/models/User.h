#pragma once

#include <string>
#include <nlohmann/json.hpp>

namespace DataVizPro {

struct User {
    std::string id;
    std::string username;
    std::string email;
    std::string password_hash; // Only used for registration/login, not exposed via API

    // Helper to convert to JSON for API responses (excluding sensitive info)
    nlohmann::json toJson() const {
        nlohmann::json j;
        j["id"] = id;
        j["username"] = username;
        j["email"] = email;
        return j;
    }
};

} // namespace DataVizPro
```