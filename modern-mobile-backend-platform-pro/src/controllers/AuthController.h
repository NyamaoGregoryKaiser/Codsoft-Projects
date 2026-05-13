```cpp
#pragma once

#include "BaseController.h"
#include "src/services/AuthService.h"
#include <memory>

namespace controllers
{
    /**
     * @brief Controller for user authentication endpoints (registration, login).
     * Inherits from BaseController for common utilities and error handling.
     */
    class AuthController : public drogon::HttpController<AuthController>, public BaseController
    {
    public:
        /**
         * @brief Constructor for AuthController.
         * @param authService Shared pointer to the AuthService instance.
         */
        explicit AuthController(std::shared_ptr<services::AuthService> authService);

        METHOD_LIST_BEGIN
        // API group "/api/v1/auth"
        ADD_METHOD_TO(AuthController::registerUser, "/api/v1/auth/register", drogon::Post, {middleware::ErrorHandlingMiddleware, middleware::RateLimitingMiddleware});
        ADD_METHOD_TO(AuthController::loginUser, "/api/v1/auth/login", drogon::Post, {middleware::ErrorHandlingMiddleware, middleware::RateLimitingMiddleware});
        METHOD_LIST_END

        /**
         * @brief Handles user registration requests.
         * Expects a JSON body with username, email, password, etc.
         * @param req The HTTP request.
         * @param callback The callback to send the response.
         */
        void registerUser(const drogon::HttpRequestPtr &req, drogon::HttpCallback &&callback);

        /**
         * @brief Handles user login requests.
         * Expects a JSON body with emailOrUsername and password.
         * @param req The HTTP request.
         * @param callback The callback to send the response.
         */
        void loginUser(const drogon::HttpRequestPtr &req, drogon::HttpCallback &&callback);

    private:
        std::shared_ptr<services::AuthService> authService_;
    };

} // namespace controllers
```