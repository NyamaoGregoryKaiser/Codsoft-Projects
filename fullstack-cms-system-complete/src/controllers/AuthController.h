```cpp
#pragma once

#include <drogon/HttpController.h>
#include <json/json.h>

namespace ApexContent::Controller {

class AuthController : public drogon::HttpController<AuthController> {
public:
    METHOD_LIST_BEGIN
    // POST /api/v1/auth/login
    METHOD_ADD(AuthController::login, "/login", drogon::Post, "RateLimitFilter");
    // POST /api/v1/auth/register
    METHOD_ADD(AuthController::registerUser, "/register", drogon::Post, "RateLimitFilter");
    // POST /api/v1/auth/refresh
    METHOD_ADD(AuthController::refresh, "/refresh", drogon::Post, "RateLimitFilter");
    METHOD_LIST_END

    void login(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void registerUser(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void refresh(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
};

} // namespace ApexContent::Controller
```