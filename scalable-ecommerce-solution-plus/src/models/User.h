```cpp
#pragma once

#include <string>
#include <json/json.h> // Using jsoncpp as Drogon often uses it or similar

namespace ECommerce {
    namespace Models {

        struct User {
            long id = 0;
            std::string username;
            std::string email;
            std::string password_hash; // Hashed password
            std::string created_at;
            std::string updated_at;
            std::string role = "user"; // "user", "admin"

            Json::Value toJson() const {
                Json::Value root;
                root["id"] = (Json::Int64)id;
                root["username"] = username;
                root["email"] = email;
                root["createdAt"] = created_at;
                root["updatedAt"] = updated_at;
                root["role"] = role;
                // Do NOT include password_hash in toJson() for security
                return root;
            }

            void fromJson(const Json::Value& json) {
                if (json.isMember("id")) id = json["id"].asInt64();
                if (json.isMember("username")) username = json["username"].asString();
                if (json.isMember("email")) email = json["email"].asString();
                if (json.isMember("password_hash")) password_hash = json["password_hash"].asString(); // Only for internal use
                if (json.isMember("createdAt")) created_at = json["createdAt"].asString();
                if (json.isMember("updatedAt")) updated_at = json["updatedAt"].asString();
                if (json.isMember("role")) role = json["role"].asString();
            }
        };

        struct UserRegisterDTO {
            std::string username;
            std::string email;
            std::string password;

            void fromJson(const Json::Value& json) {
                if (json.isMember("username")) username = json["username"].asString();
                if (json.isMember("email")) email = json["email"].asString();
                if (json.isMember("password")) password = json["password"].asString();
            }
        };

        struct UserLoginDTO {
            std::string email;
            std::string password;

            void fromJson(const Json::Value& json) {
                if (json.isMember("email")) email = json["email"].asString();
                if (json.isMember("password")) password = json["password"].asString();
            }
        };
    }
}
```