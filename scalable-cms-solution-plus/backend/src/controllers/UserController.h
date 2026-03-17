#pragma once

#include <drogon/HttpSimpleController.h>
#include <drogon/HttpResponse.h>
#include <json/json.h>
#include "common/Constants.h"

namespace cms {

class UserController : public drogon::HttpSimpleController<UserController> {
public:
    PATH_LIST_BEGIN
    // Get all users (Admin only)
    PATH_ADD(USERS_BASE_PATH, drogon::Get, "AuthMiddleware", "AdminMiddleware");
    // Get user by ID (Admin only)
    PATH_ADD(USER_BY_ID_PATH, drogon::Get, "AuthMiddleware", "AdminMiddleware");
    // Get user profile (authenticated user)
    PATH_ADD(USER_PROFILE_PATH, drogon::Get, "AuthMiddleware");
    // Update user by ID (Admin only)
    PATH_ADD(USER_BY_ID_PATH, drogon::Put, "AuthMiddleware", "AdminMiddleware");
    // Delete user by ID (Admin only)
    PATH_ADD(USER_BY_ID_PATH, drogon::Delete, "AuthMiddleware", "AdminMiddleware");
    PATH_LIST_END

    // GET /api/v1/users
    void getAllUsers(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);

    // GET /api/v1/users/{id}
    void getUserById(const drogon::HttpRequestPtr& req,
                     std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                     std::string id);

    // GET /api/v1/users/profile
    void getUserProfile(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);

    // PUT /api/v1/users/{id}
    void updateUser(const drogon::HttpRequestPtr& req,
                    std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                    std::string id);

    // DELETE /api/v1/users/{id}
    void deleteUser(const drogon::HttpRequestPtr& req,
                    std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                    std::string id);

private:
    drogon::HttpResponsePtr createErrorResponse(drogon::HttpStatusCode code, const std::string& message);
    drogon::HttpResponsePtr createSuccessResponse(const Json::Value& data);
    drogon::HttpResponsePtr createUserResponseJson(const drogon_model::cms_system::User& user);
};

} // namespace cms
```