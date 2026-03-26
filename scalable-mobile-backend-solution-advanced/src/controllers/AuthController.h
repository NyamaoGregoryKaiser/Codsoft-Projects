```cpp
#pragma once

#include <drogon/HttpController.h>
#include <json/json.h>
#include "../services/AuthService.h"
#include "../utils/Logger.h"
#include "../utils/Common.h" // For ApiException

/**
 * @brief Controller for user authentication and registration endpoints.
 */
class AuthController : public drogon::HttpController<AuthController> {
public:
    // Inject AuthService
    explicit AuthController(AuthService authService = AuthService());

    METHOD_LIST_BEGIN
    // Register method endpoints
    METHOD_ADD(AuthController::registerUser, "/register", drogon::Post, "RateLimitFilter");
    METHOD_ADD(AuthController::loginUser, "/login", drogon::Post, "RateLimitFilter");
    METHOD_LIST_END

    /**
     * @brief Handles user registration (POST /auth/register).
     * @param req The HTTP request containing username, email, and password.
     * @param callback The callback to send the response.
     */
    void registerUser(const drogon::HttpRequestPtr& req,
                      std::function<void(const drogon::HttpResponsePtr&)>&& callback);

    /**
     * @brief Handles user login (POST /auth/login).
     * @param req The HTTP request containing email and password.
     * @param callback The callback to send the response.
     */
    void loginUser(const drogon::HttpRequestPtr& req,
                   std::function<void(const drogon::HttpResponsePtr&)>&& callback);

private:
    AuthService authService;
};
```