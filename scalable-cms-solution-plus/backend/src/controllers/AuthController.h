#pragma once

#include <drogon/HttpSimpleController.h>
#include <drogon/HttpResponse.h>
#include <json/json.h>

namespace cms {

class AuthController : public drogon::HttpSimpleController<AuthController> {
public:
    PATH_LIST_BEGIN
    PATH_ADD(AUTH_REGISTER_PATH, drogon::Post);
    PATH_ADD(AUTH_LOGIN_PATH, drogon::Post);
    PATH_ADD(AUTH_REFRESH_PATH, drogon::Post);
    PATH_ADD(AUTH_LOGOUT_PATH, drogon::Post, "AuthMiddleware"); // Require auth for logout
    PATH_LIST_END

    // POST /api/v1/auth/register
    void registerUser(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);

    // POST /api/v1/auth/login
    void login(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);

    // POST /api/v1/auth/refresh
    void refresh(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);

    // POST /api/v1/auth/logout
    void logout(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);

private:
    drogon::HttpResponsePtr createErrorResponse(drogon::HttpStatusCode code, const std::string& message);
    drogon::HttpResponsePtr createSuccessResponse(const Json::Value& data);
};

} // namespace cms
```