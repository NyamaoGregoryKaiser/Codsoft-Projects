```cpp
#pragma once

#include <string>
#include <chrono>
#include <json/json.h>
#include <drogon/orm/Mapper.h> // For Drogon ORM integration

// Define a type for UUIDs if not globally defined (Drogon's ORM might use std::string or trantor::UUID)
using UUID = std::string; // For simplicity, represent UUIDs as strings

/**
 * @brief Represents a User entity in the system.
 *
 * This struct maps to the 'users' table in the database and contains
 * user-specific information.
 */
struct User {
    UUID id;
    std::string username;
    std::string email;
    std::string password_hash; // Stored securely as a bcrypt hash
    std::chrono::system_clock::time_point created_at;
    std::chrono::system_clock::time_point updated_at;
    std::vector<std::string> roles = {"user"}; // Default role, can be extended for 'admin' etc.

    // Default constructor
    User() = default;

    // Parameterized constructor
    User(const UUID& id, const std::string& username, const std::string& email, const std::string& passwordHash,
         const std::chrono::system_clock::time_point& createdAt, const std::chrono::system_clock::time_point& updatedAt)
        : id(id), username(username), email(email), password_hash(passwordHash), created_at(createdAt), updated_at(updatedAt) {}

    /**
     * @brief Converts the User object to a JSON representation.
     * @param includePasswordHash If true, the password_hash will be included (usually false for API responses).
     * @return Json::Value representing the User.
     */
    Json::Value toJson(bool includePasswordHash = false) const {
        Json::Value json;
        json["id"] = id;
        json["username"] = username;
        json["email"] = email;
        if (includePasswordHash) {
            json["password_hash"] = password_hash;
        }
        json["created_at"] = Common::timePointToString(created_at);
        json["updated_at"] = Common::timePointToString(updated_at);
        
        Json::Value roles_array(Json::arrayValue);
        for(const auto& role : roles) {
            roles_array.append(role);
        }
        json["roles"] = roles_array;

        return json;
    }

    /**
     * @brief Creates a User object from a Drogon ORM model result.
     * @param model The Drogon ORM model for User.
     * @return A User struct initialized with data from the model.
     */
    static User fromDrogonModel(const drogon::orm::Result& result) {
        User user;
        user.id = result["id"].as<UUID>();
        user.username = result["username"].as<std::string>();
        user.email = result["email"].as<std::string>();
        user.password_hash = result["password_hash"].as<std::string>();
        user.created_at = result["created_at"].as<std::chrono::system_clock::time_point>();
        user.updated_at = result["updated_at"].as<std::chrono::system_clock::time_point>();
        // Assuming roles are not directly in DB, or retrieved separately.
        // For simplicity, default to "user" and add "admin" if username is "admin"
        if (user.username == "admin") {
            user.roles.push_back("admin");
        }
        return user;
    }
};
```