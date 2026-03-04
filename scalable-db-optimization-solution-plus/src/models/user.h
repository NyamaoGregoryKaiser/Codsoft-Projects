```cpp
#ifndef OPTIDB_USER_H
#define OPTIDB_USER_H

#include "base_model.h"
#include <string>
#include <nlohmann/json.hpp>

class User : public BaseModel {
public:
    std::string username;
    std::string email;
    std::string password_hash; // Storing hashed password

    User() = default;
    User(long id, const std::string& username, const std::string& email, const std::string& password_hash,
         std::chrono::system_clock::time_point created_at, std::chrono::system_clock::time_point updated_at)
        : username(username), email(email), password_hash(password_hash) {
        this->id = id;
        this->created_at = created_at;
        this->updated_at = updated_at;
    }

    nlohmann::json to_json() const override {
        nlohmann::json j;
        j["id"] = id;
        j["username"] = username;
        j["email"] = email;
        j["created_at"] = to_iso8601(created_at);
        j["updated_at"] = to_iso8601(updated_at);
        // Do not include password_hash in JSON output
        return j;
    }
};

#endif // OPTIDB_USER_H
```