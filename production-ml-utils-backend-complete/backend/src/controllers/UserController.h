#pragma once

#include "crow.h"
#include "services/UserService.h"
#include "middleware/AuthMiddleware.h" // To get user_id from request context

class UserController {
private:
    static UserService user_service; // Using a static service instance

public:
    UserController() = delete; // Static class, no instance needed

    static void getCurrentUser(const crow::request& req, crow::response& res);
};
```