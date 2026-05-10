```cpp
#ifndef AUTH_SYSTEM_USER_CONTROLLER_H
#define AUTH_SYSTEM_USER_CONTROLLER_H

#include "crow.h"
#include <memory>
#include <regex>

#include "../database/Database.h"
#include "../models/User.h"
#include "../auth/AuthService.h" // Needed for password hashing if user updates password
#include "../auth/AuthMiddleware.h" // To access authenticated_user from context
#include "../utils/Logger.h"
#include "../utils/JsonUtils.h"

class UserController {
public:
    explicit UserController(std::shared_ptr<Database> db);

    crow::response getUserProfile(const crow::request& req, crow::response& res);
    crow::response updateUserProfile(const crow::request& req, crow::response& res);
    crow::response deleteUserProfile(const crow::request& req, crow::response& res);

private:
    std::shared_ptr<Database> db_;
    std::shared_ptr<AuthService> authService_; // Needed for password hashing/verification

    bool isValidEmail(const std::string& email) const;
    bool isValidPassword(const std::string& password) const;
    bool isValidUsername(const std::string& username) const;
};

#endif // AUTH_SYSTEM_USER_CONTROLLER_H
```