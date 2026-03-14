#pragma once

#include <drogon/HttpController.h>
#include <drogon/utils/FunctionTraits.h>
#include <json/json.h>

class UserController : public drogon::HttpController<UserController> {
public:
    METHOD_LIST_BEGIN
    METHOD_ADD(UserController::getAllUsers, "/api/v1/users", {drogon::Get});
    METHOD_ADD(UserController::getUserById, "/api/v1/users/{id}", {drogon::Get});
    METHOD_ADD(UserController::updateUser, "/api/v1/users/{id}", {drogon::Put});
    METHOD_ADD(UserController::deleteUser, "/api/v1/users/{id}", {drogon::Delete});
    METHOD_LIST_END

    void getAllUsers(const drogon::HttpRequestPtr &req,
                     std::function<void(const drogon::HttpResponsePtr &)> &&callback);

    void getUserById(const drogon::HttpRequestPtr &req,
                     std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                     const std::string &id);

    void updateUser(const drogon::HttpRequestPtr &req,
                    std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                    const std::string &id);

    void deleteUser(const drogon::HttpRequestPtr &req,
                    std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                    const std::string &id);
};