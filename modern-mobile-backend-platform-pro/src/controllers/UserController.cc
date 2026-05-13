```cpp
#include "UserController.h"
#include "src/models/DTOs.h"
#include "src/utils/Logger.h"
#include "src/exceptions/ApiException.h"
#include <json/json.h>

namespace controllers
{
    UserController::UserController(std::shared_ptr<services::UserService> userService)
        : userService_(std::move(userService))
    {
        LOG_INFO("UserController initialized.");
    }

    void UserController::getProfile(const drogon::HttpRequestPtr &req, drogon::HttpCallback &&callback, std::string id)
    {
        std::string requesterUserId = getUserIdFromRequest(req);
        if (id != requesterUserId)
        {
            // For a real app, implement role-based access control here (e.g., admin can view any profile)
            LOG_WARN("User '{}' attempted to access profile of user '{}' without authorization.", requesterUserId, id);
            throw api::ForbiddenException("Access to this user profile is forbidden.", "FORBIDDEN_USER_PROFILE");
        }

        userService_->getUserById(id)
            .then([this, callback](models::User user) {
                callback(createSuccessResponse(user.toJson(), "User profile retrieved successfully."));
            })
            .then([callback](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (...) { /* Rethrow for middleware */ }
            });
    }

    void UserController::updateProfile(const drogon::HttpRequestPtr &req, drogon::HttpCallback &&callback, std::string id)
    {
        std::string requesterUserId = getUserIdFromRequest(req);
        if (id != requesterUserId)
        {
            LOG_WARN("User '{}' attempted to update profile of user '{}' without authorization.", requesterUserId, id);
            throw api::ForbiddenException("Access to update this user profile is forbidden.", "FORBIDDEN_USER_PROFILE_UPDATE");
        }

        auto json = parseJsonBody(req);
        models::UpdateUserRequest request;
        request.fromJson(json);

        userService_->updateUser(id, request)
            .then([this, callback](models::User user) {
                callback(createSuccessResponse(user.toJson(), "User profile updated successfully."));
            })
            .then([callback](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (...) { /* Rethrow for middleware */ }
            });
    }

    void UserController::deleteUser(const drogon::HttpRequestPtr &req, drogon::HttpCallback &&callback, std::string id)
    {
        std::string requesterUserId = getUserIdFromRequest(req);
        if (id != requesterUserId)
        {
            LOG_WARN("User '{}' attempted to delete account of user '{}' without authorization.", requesterUserId, id);
            throw api::ForbiddenException("Access to delete this user account is forbidden.", "FORBIDDEN_USER_DELETE");
        }

        userService_->deleteUser(id)
            .then([this, callback](bool success) {
                (void)success; // Suppress unused variable warning
                callback(createSuccessResponse({}, "User account deleted successfully."));
            })
            .then([callback](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (...) { /* Rethrow for middleware */ }
            });
    }

    void UserController::getAllUsers(const drogon::HttpRequestPtr &req, drogon::HttpCallback &&callback)
    {
        // In a real application, this would require ADMIN role check
        // For demonstration, we simply require any authenticated user.
        std::string requesterUserId = getUserIdFromRequest(req);
        LOG_INFO("User '{}' requested all user profiles.", requesterUserId);

        userService_->getAllUsers()
            .then([this, callback](std::vector<models::User> users) {
                Json::Value usersJson(Json::arrayValue);
                for (const auto &user : users)
                {
                    usersJson.append(user.toJson());
                }
                callback(createSuccessResponse(usersJson, "All users retrieved successfully."));
            })
            .then([callback](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (...) { /* Rethrow for middleware */ }
            });
    }

} // namespace controllers
```