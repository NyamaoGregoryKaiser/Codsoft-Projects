```cpp
#include "User.h"

User::User(long long id, std::string username, std::string email, std::string password_hash, std::string created_at, std::string updated_at)
    : id(id), username(std::move(username)), email(std::move(email)), password_hash(std::move(password_hash)), created_at(std::move(created_at)), updated_at(std::move(updated_at)) {}

nlohmann::json User::toJson() const {
    nlohmann::json j;
    if (id) {
        j["id"] = *id;
    }
    j["username"] = username;
    j["email"] = email;
    // Do NOT include password_hash in public JSON
    j["created_at"] = created_at;
    j["updated_at"] = updated_at;
    return j;
}

User User::fromJson(const nlohmann::json& j) {
    User user;
    user.id = j.contains("id") ? std::optional<long long>(j.at("id").get<long long>()) : std::nullopt;
    user.username = j.at("username").get<std::string>();
    user.email = j.at("email").get<std::string>();
    // Password hash should not be set directly from JSON; it's handled by AuthService
    // If a password field exists, it's for AuthService to hash.
    return user;
}
```