#pragma once

#include "crow.h"
#include "services/UserService.h"
#include <string>

class AuthController {
private:
    static UserService user_service; // Using a static service instance

    // Helper to generate JWT
    static std::string generateJwtToken(const std::string& user_id);

public:
    AuthController() = delete; // Static class, no instance needed

    static crow::response registerUser(const crow::request& req);
    static crow::response loginUser(const crow::request& req);
};
```