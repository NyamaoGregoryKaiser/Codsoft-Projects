#ifndef AUTH_SYSTEM_USER_H
#define AUTH_SYSTEM_USER_H

#include <string>
#include <vector>
#include <optional>
#include "nlohmann/json.hpp"

enum class UserRole {
    USER,
    ADMIN
};

// Helper to convert string to UserRole
inline UserRole stringToUserRole(const std::string& roleStr) {
    if (roleStr == "ADMIN") {
        return UserRole::ADMIN;
    }
    return UserRole::USER;
}

// Helper to convert UserRole to string
inline std::string userRoleToString(UserRole role) {
    switch (role) {
        case UserRole::ADMIN: return "ADMIN";
        case UserRole::USER: return "USER";
        default: return "UNKNOWN"; // Should not happen
    }
}

class User {
public:
    User(std::optional<int> id, const std::string& username, const std::string& passwordHash, UserRole role)
        : id_(id), username_(username), passwordHash_(passwordHash), role_(role) {}

    // Getters
    std::optional<int> getId() const { return id_; }
    const std::string& getUsername() const { return username_; }
    const std::string& getPasswordHash() const { return passwordHash_; }
    UserRole getRole() const { return role_; }

    // Setters (for updates or initialization)
    void setId(int id) { id_ = id; }
    void setUsername(const std::string& username) { username_ = username; }
    void setPasswordHash(const std::string& passwordHash) { passwordHash_ = passwordHash; }
    void setRole(UserRole role) { role_ = role; }

    // Convert User object to JSON (for API responses)
    nlohmann::json toJson() const;

private:
    std::optional<int> id_;
    std::string username_;
    std::string passwordHash_; // Stored as hash, never exposed
    UserRole role_;
};

#endif // AUTH_SYSTEM_USER_H