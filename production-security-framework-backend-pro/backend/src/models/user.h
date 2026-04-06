#pragma once

#include <string>
#include <vector>
#include <optional>
#include <nlohmann/json.hpp>

namespace Models {

enum class UserRole {
    USER,
    ADMIN,
    GUEST // Example
};

// Helper to convert string to UserRole
std::optional<UserRole> stringToUserRole(const std::string& role_str);
std::string userRoleToString(UserRole role);

struct User {
    std::string id;
    std::string email;
    std::string password_hash;
    UserRole role;
    std::string created_at; // ISO 8601 string
    std::string updated_at; // ISO 8601 string

    // For JSON serialization/deserialization
    NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(User, id, email, password_hash, role, created_at, updated_at)

    // Custom serializer for UserRole
    friend void to_json(nlohmann::json& j, const UserRole& role) {
        j = userRoleToString(role);
    }

    friend void from_json(const nlohmann::json& j, UserRole& role) {
        if (j.is_string()) {
            std::optional<UserRole> r = stringToUserRole(j.get<std::string>());
            if (r) {
                role = *r;
            } else {
                throw nlohmann::json::out_of_range("Cannot convert string to UserRole: " + j.get<std::string>());
            }
        } else {
            throw nlohmann::json::type_error::create(302, "UserRole must be a string");
        }
    }
};

inline std::optional<UserRole> stringToUserRole(const std::string& role_str) {
    if (role_str == "USER") return UserRole::USER;
    if (role_str == "ADMIN") return UserRole::ADMIN;
    if (role_str == "GUEST") return UserRole::GUEST;
    return std::nullopt;
}

inline std::string userRoleToString(UserRole role) {
    switch (role) {
        case UserRole::USER: return "USER";
        case UserRole::ADMIN: return "ADMIN";
        case UserRole::GUEST: return "GUEST";
        default: return "UNKNOWN";
    }
}

} // namespace Models