```cpp
#ifndef AUTH_SERVICE_H
#define AUTH_SERVICE_H

#include "core/models/User.h"
#include <string>
#include <optional>

class AuthService {
public:
    // Register a new user
    static User registerUser(const std::string& username, const std::string& email, const std::string& password);

    // Authenticate user and return JWT token
    static std::optional<std::string> loginUser(const std::string& email, const std::string& password);

    // Helper to hash password
    static std::string hashPassword(const std::string& password);

    // Helper to verify password
    static bool verifyPassword(const std::string& password, const std::string& stored_hash);

private:
    AuthService() = delete; // Prevent instantiation
};

#endif // AUTH_SERVICE_H
```