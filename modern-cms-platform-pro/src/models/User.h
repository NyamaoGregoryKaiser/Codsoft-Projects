#pragma once

#include <string>
#include <json/json.h>

struct User {
    std::string id;
    std::string username;
    std::string email;
    std::string password_hash; // Stored hashed password
    std::string role;
    std::string created_at;
    std::string updated_at;

    // Convert User object to JSON
    Json::Value toJson(bool include_sensitive = false) const {
        Json::Value userJson;
        userJson["id"] = id;
        userJson["username"] = username;
        userJson["email"] = email;
        userJson["role"] = role;
        userJson["created_at"] = created_at;
        userJson["updated_at"] = updated_at;
        if (include_sensitive) {
            userJson["password_hash"] = password_hash; // Only for admin/internal use
        }
        return userJson;
    }
};