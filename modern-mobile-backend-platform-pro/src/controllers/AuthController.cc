```cpp
#include "AuthController.h"
#include "src/models/DTOs.h"
#include "src/utils/Logger.h"
#include <json/json.h>

namespace controllers
{
    AuthController::AuthController(std::shared_ptr<services::AuthService> authService)
        : authService_(std::move(authService))
    {
        LOG_INFO("AuthController initialized.");
    }

    void AuthController::registerUser(const drogon::HttpRequestPtr &req, drogon::HttpCallback &&callback)
    {
        auto json = parseJsonBody(req);
        models::RegisterRequest request;
        request.fromJson(json);

        authService_->registerUser(request)
            .then([this, callback](models::User user) {
                // Return a success response, user object without password hash
                callback(createSuccessResponse(user.toJson(), "User registered successfully!", drogon::k201Created));
            })
            .then([callback](std::exception_ptr eptr) {
                // Exceptions are handled by ErrorHandlingMiddleware
                try { std::rethrow_exception(eptr); }
                catch (...) { /* Rethrow for middleware */ }
            });
    }

    void AuthController::loginUser(const drogon::HttpRequestPtr &req, drogon::HttpCallback &&callback)
    {
        auto json = parseJsonBody(req);
        models::LoginRequest request;
        request.fromJson(json);

        authService_->loginUser(request)
            .then([this, callback](models::LoginResponse response) {
                // Return a success response with JWT token
                callback(createSuccessResponse(response.toJson(), "Login successful!"));
            })
            .then([callback](std::exception_ptr eptr) {
                // Exceptions are handled by ErrorHandlingMiddleware
                try { std::rethrow_exception(eptr); }
                catch (...) { /* Rethrow for middleware */ }
            });
    }

} // namespace controllers
```