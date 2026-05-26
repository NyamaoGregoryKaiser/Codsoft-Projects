#pragma once

#include <string>
#include <nlohmann/json.hpp>
#include "models/User.h"

namespace DataVizPro {

class AuthManager {
public:
    AuthManager();

    // Registers a new user
    User registerUser(const std::string& username, const std::string& email, const std::string& password);

    // Authenticates a user and returns a JWT token
    std::string loginUser(const std::string& username, const std::string& password);

    // Hashes a password (e.g., using bcrypt)
    std::string hashPassword(const std::string& password);

    // Verifies a password against a hash
    bool verifyPassword(const std::string& password, const std::string& hash);

private:
    // This example uses a placeholder for password hashing.
    // In a real app, integrate a strong library like bcrypt (e.g., using Argon2/scrypt if available)
    std::string _hashPassword(const std::string& password);
    bool _verifyPassword(const std::string& password, const std::string& hash);
};

} // namespace DataVizPro
```