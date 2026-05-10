```cpp
#ifndef AUTH_SYSTEM_AUTH_MIDDLEWARE_H
#define AUTH_SYSTEM_AUTH_MIDDLEWARE_H

#include "crow.h"
#include <string>
#include <memory>
#include <optional>

#include "AuthService.h"
#include "../utils/Logger.h"
#include "../utils/JsonUtils.h"

// Define a context structure for authenticated user info
struct AuthContext {
    std::string user_id;
    std::string email;
    // Add other user claims as needed, e.g., roles
};

// Custom middleware for JWT authentication
struct AuthMiddleware {
    // You can initialize shared resources here if needed
    // In this case, AuthService will be provided during app initialization
    AuthService* auth_service = nullptr;

    AuthMiddleware(); // Default constructor
    explicit AuthMiddleware(AuthService* service);

    // Context for the middleware to inject into requests
    struct context {
        std::optional<AuthContext> authenticated_user;
    };

    void before_handle(crow::request& req, crow::response& res, context& ctx);
    void after_handle(crow::request& req, crow::response& res, context& ctx);
};

#endif // AUTH_SYSTEM_AUTH_MIDDLEWARE_H
```