#include "User.h"
#include <random>
#include <sstream>
#include <iomanip> // For std::hex, std::setw, std::setfill

namespace UUID {
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(0, 15);
    std::uniform_int_distribution<> dis2(8, 11);

    std::string generate_uuid_v4() {
        std::stringstream ss;
        int i;
        ss << std::hex;
        for (i = 0; i < 8; i++) {
            ss << dis(gen);
        }
        ss << "-";
        for (i = 0; i < 4; i++) {
            ss << dis(gen);
        }
        ss << "-4"; // UUID v4
        for (i = 0; i < 3; i++) {
            ss << dis(gen);
        }
        ss << "-";
        ss << dis2(gen); // Variant
        for (i = 0; i < 3; i++) {
            ss << dis(gen);
        }
        ss << "-";
        for (i = 0; i < 12; i++) {
            ss << dis(gen);
        }
        return ss.str();
    }
} // namespace UUID

nlohmann::json User::toJson() const {
    nlohmann::json j;
    j["id"] = id;
    j["username"] = username;
    j["email"] = email;
    // Do NOT include password_hash in toJson() for security reasons
    j["created_at"] = created_at;
    j["updated_at"] = updated_at;
    return j;
}

User User::fromJson(const nlohmann::json& json) {
    User user;
    user.id = json.value("id", UUID::generate_uuid_v4()); // Generate new if not present (for creation)
    user.username = json.at("username").get<std::string>();
    user.email = json.at("email").get<std::string>();
    user.password_hash = json.value("password_hash", ""); // Password hash should only be set internally
    user.created_at = json.value("created_at", "");
    user.updated_at = json.value("updated_at", "");
    return user;
}
```