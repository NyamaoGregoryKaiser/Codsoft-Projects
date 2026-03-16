```cpp
#ifndef USER_H
#define USER_H

#include <string>
#include <optional>
#include <nlohmann/json.hpp>

class User {
public:
    std::optional<long long> id;
    std::string username;
    std::string email;
    std::string password_hash;
    std::string created_at; // ISO 8601 string
    std::string updated_at; // ISO 8601 string

    User() = default;
    User(long long id, std::string username, std::string email, std::string password_hash, std::string created_at, std::string updated_at);

    // Serialization to JSON
    nlohmann::json toJson() const;

    // Deserialization from JSON (for creating new user from request body)
    static User fromJson(const nlohmann::json& j);

    // Comparison for testing or unique checks
    bool operator==(const User& other) const {
        return id == other.id && username == other.username && email == other.email;
    }
};

#endif // USER_H
```