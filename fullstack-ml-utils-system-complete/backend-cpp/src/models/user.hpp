#ifndef ML_UTILITIES_SYSTEM_USER_HPP
#define ML_UTILITIES_SYSTEM_USER_HPP

#include <string>
#include <chrono>
#include "nlohmann/json.hpp" // For JSON serialization/deserialization

/**
 * @brief Represents a User entity in the system.
 */
struct User {
    int id = 0;
    std::string email;
    std::string password_hash; // Stored as bcrypt hash
    std::string role;          // e.g., "user", "admin"
    std::chrono::system_clock::time_point created_at;
    std::chrono::system_clock::time_point updated_at;

    // Default constructor
    User() = default;

    // Parameterized constructor
    User(int id, const std::string& email, const std::string& password_hash, const std::string& role,
         std::chrono::system_clock::time_point created_at, std::chrono::system_clock::time_point updated_at)
        : id(id), email(email), password_hash(password_hash), role(role),
          created_at(created_at), updated_at(updated_at) {}

    /**
     * @brief Converts a User object to a JSON object.
     * Includes only public-facing fields (no password hash).
     * @return A `nlohmann::json` object representing the user.
     */
    nlohmann::json toJson() const {
        return nlohmann::json{
            {"id", id},
            {"email", email},
            {"role", role},
            {"createdAt", std::chrono::duration_cast<std::chrono::seconds>(created_at.time_since_epoch()).count()},
            {"updatedAt", std::chrono::duration_cast<std::chrono::seconds>(updated_at.time_since_epoch()).count()}
        };
    }
};

#endif // ML_UTILITIES_SYSTEM_USER_HPP
```