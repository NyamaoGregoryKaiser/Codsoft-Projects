```cpp
#pragma once

#include <string>
#include <optional>
#include <chrono>
#include <drogon/orm/Field.h>
#include <json/json.h> // For Json::Value

namespace models
{
    /**
     * @brief Represents a User entity.
     */
    struct User
    {
        std::string id;
        std::string username;
        std::string email;
        std::string passwordHash; // Stored hashed password
        std::optional<std::string> firstName;
        std::optional<std::string> lastName;
        std::chrono::system_clock::time_point createdAt;
        std::chrono::system_clock::time_point updatedAt;

        /**
         * @brief Converts the User object to a JSON representation.
         * Omits sensitive data like passwordHash.
         * @return Json::Value representing the user.
         */
        Json::Value toJson() const
        {
            Json::Value json;
            json["id"] = id;
            json["username"] = username;
            json["email"] = email;
            if (firstName)
                json["firstName"] = *firstName;
            if (lastName)
                json["lastName"] = *lastName;
            json["createdAt"] = drogon::orm::Field<drogon::orm::time_point>(createdAt).asSqlString();
            json["updatedAt"] = drogon::orm::Field<drogon::orm::time_point>(updatedAt).asSqlString();
            return json;
        }

        /**
         * @brief Fills the User object from a Drogon SQL row.
         * @param row The Drogon Row object.
         */
        void fromSqlRow(const drogon::orm::Row &row)
        {
            id = row["id"].as<std::string>();
            username = row["username"].as<std::string>();
            email = row["email"].as<std::string>();
            passwordHash = row["password_hash"].as<std::string>();
            firstName = row["first_name"].as<std::optional<std::string>>();
            lastName = row["last_name"].as<std::optional<std::string>>();
            createdAt = row["created_at"].as<std::chrono::system_clock::time_point>();
            updatedAt = row["updated_at"].as<std::chrono::system_clock::time_point>();
        }
    };
} // namespace models
```