```cpp
#pragma once

#include <drogon/HttpController.h>
#include <json/json.h>
#include "filters/AuthFilter.h" // For AuthData

namespace ApexContent::Controller {

class UserController : public drogon::HttpController<UserController> {
public:
    METHOD_LIST_BEGIN
    // GET /api/v1/users - Requires authentication, admin role
    METHOD_ADD(UserController::getUsers, "/users", drogon::Get, "AuthFilter");
    // GET /api/v1/users/{id} - Requires authentication, admin/self access
    METHOD_ADD(UserController::getUserById, "/users/{id}", drogon::Get, "AuthFilter");
    // POST /api/v1/users - Requires authentication, admin role (for creating other users)
    METHOD_ADD(UserController::createUser, "/users", drogon::Post, "AuthFilter");
    // PUT /api/v1/users/{id} - Requires authentication, admin/self access
    METHOD_ADD(UserController::updateUser, "/users/{id}", drogon::Put, "AuthFilter");
    // DELETE /api/v1/users/{id} - Requires authentication, admin role
    METHOD_ADD(UserController::deleteUser, "/users/{id}", drogon::Delete, "AuthFilter");
    METHOD_LIST_END

    void getUsers(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void getUserById(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback, int userId);
    void createUser(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void updateUser(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback, int userId);
    void deleteUser(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback, int userId);

private:
    bool isAdmin(const ApexContent::Filter::AuthData& authData) const;
    bool hasAccess(const ApexContent::Filter::AuthData& authData, int targetUserId) const;
};

} // namespace ApexContent::Controller
```