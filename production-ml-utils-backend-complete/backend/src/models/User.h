#pragma once

#include <string>
#include "nlohmann/json.hpp"

// Utility for UUID generation (mocked for simplicity here, use a proper library like `uuid-ossp` in prod)
namespace UUID {
    std::string generate_uuid_v4();
}

struct User {
    std::string id;
    std::string username;
    std::string email;
    std::string password_hash; // Hashed password
    std::string created_at;
    std::string updated_at;

    // Convert User object to JSON
    nlohmann::json toJson() const;

    // Create User object from JSON
    static User fromJson(const nlohmann::json& json);
};
```