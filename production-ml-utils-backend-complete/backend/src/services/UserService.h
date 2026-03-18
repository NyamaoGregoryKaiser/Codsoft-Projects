#pragma once

#include "models/User.h"
#include <string>
#include <optional>

class UserService {
public:
    UserService() = default;

    std::string hashPassword(const std::string& password) const; // Mocked for this example
    bool verifyPassword(const std::string& password, const std::string& hashed_password) const; // Mocked

    User createUser(const std::string& username, const std::string& email, const std::string& password);
    std::optional<User> getUserByEmail(const std::string& email);
    std::optional<User> getUserById(const std::string& id);
    // Add other user management functions as needed
};
```