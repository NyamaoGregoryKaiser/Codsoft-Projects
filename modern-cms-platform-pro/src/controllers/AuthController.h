#pragma once

#include <drogon/HttpController.h>
#include <drogon/utils/FunctionTraits.h>
#include <json/json.h>

class AuthController : public drogon::HttpController<AuthController> {
public:
    METHOD_LIST_BEGIN
    METHOD_ADD(AuthController::registerUser, "/register", {drogon::Post});
    METHOD_ADD(AuthController::loginUser, "/login", {drogon::Post});
    METHOD_LIST_END

    void registerUser(const drogon::HttpRequestPtr &req,
                      std::function<void(const drogon::HttpResponsePtr &)> &&callback);

    void loginUser(const drogon::HttpRequestPtr &req,
                   std::function<void(const drogon::HttpResponsePtr &)> &&callback);
};