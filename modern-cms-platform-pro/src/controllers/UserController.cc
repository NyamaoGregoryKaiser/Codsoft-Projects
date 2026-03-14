#include "UserController.h"
#include "services/UserService.h"
#include "utils/ApiResponse.h"
#include "models/User.h" // To get user_info from req context

void UserController::getAllUsers(const drogon::HttpRequestPtr &req,
                                 std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
    LOG_INFO << "Fetching all users (admin-only).";
    auto user = req->getAttributes()->get<User>("user_info");
    if (user.id.empty() || user.role != "admin") {
        return callback(ApiResponse::forbidden("Admin access required."));
    }

    UserService::getInstance()->getAllUsers(
        [callback](const std::vector<User>& users, const std::string& error) {
            if (!error.empty()) {
                LOG_ERROR << "Failed to retrieve users: " << error;
                return callback(ApiResponse::internalError("Failed to retrieve users."));
            }
            Json::Value data = Json::arrayValue;
            for (const auto& u : users) {
                data.append(u.toJson(true)); // Include sensitive fields for admin
            }
            return callback(ApiResponse::ok("Users retrieved successfully.", data));
        }
    );
}

void UserController::getUserById(const drogon::HttpRequestPtr &req,
                                 std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                                 const std::string &id) {
    LOG_INFO << "Fetching user by ID (admin-only): " << id;
    auto user = req->getAttributes()->get<User>("user_info");
    if (user.id.empty() || (user.role != "admin" && user.id != id)) { // Admin or self access
        return callback(ApiResponse::forbidden("Admin access or self-access required."));
    }

    UserService::getInstance()->getUserById(id,
        [callback, current_user_id = user.id, requested_user_id = id](const std::optional<User>& user, const std::string& error) {
            if (!error.empty()) {
                LOG_ERROR << "Failed to retrieve user by ID: " << error;
                return callback(ApiResponse::internalError("Failed to retrieve user."));
            }
            if (!user) {
                return callback(ApiResponse::notFound("User not found."));
            }
            return callback(ApiResponse::ok("User retrieved successfully.", user->toJson(current_user_id == requested_user_id || user->role == "admin")));
        }
    );
}

void UserController::updateUser(const drogon::HttpRequestPtr &req,
                                std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                                const std::string &id) {
    LOG_INFO << "Updating user with ID (admin-only): " << id;
    auto json = req->getJsonObject();
    if (!json) {
        return callback(ApiResponse::badRequest("Invalid JSON payload."));
    }

    auto user = req->getAttributes()->get<User>("user_info");
    if (user.id.empty() || (user.role != "admin" && user.id != id)) { // Admin or self access
        return callback(ApiResponse::forbidden("Admin access or self-access required to update user."));
    }

    // Prevent non-admin users from changing their role
    if (user.role != "admin" && json->isMember("role")) {
        return callback(ApiResponse::forbidden("Only administrators can change user roles."));
    }

    UserService::getInstance()->updateUser(id, *json,
        [callback](const std::optional<User>& updatedUser, const std::string& error) {
            if (!error.empty()) {
                if (error == "Not Found") {
                    return callback(ApiResponse::notFound("User not found."));
                }
                LOG_ERROR << "Failed to update user: " << error;
                return callback(ApiResponse::internalError("Failed to update user."));
            }
            if (!updatedUser) {
                 return callback(ApiResponse::internalError("Failed to update user, no user returned."));
            }
            return callback(ApiResponse::ok("User updated successfully.", updatedUser->toJson(true)));
        }
    );
}

void UserController::deleteUser(const drogon::HttpRequestPtr &req,
                                std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                                const std::string &id) {
    LOG_INFO << "Deleting user with ID (admin-only): " << id;
    auto user = req->getAttributes()->get<User>("user_info");
    if (user.id.empty() || user.role != "admin") {
        return callback(ApiResponse::forbidden("Admin access required to delete user."));
    }

    // Prevent admin from deleting themselves (or enforce this rule)
    if (user.id == id) {
        return callback(ApiResponse::forbidden("Cannot delete your own admin account."));
    }

    UserService::getInstance()->deleteUser(id,
        [callback](bool success, const std::string& error) {
            if (!error.empty()) {
                if (error == "Not Found") {
                    return callback(ApiResponse::notFound("User not found."));
                }
                LOG_ERROR << "Failed to delete user: " << error;
                return callback(ApiResponse::internalError("Failed to delete user."));
            }
            if (!success) {
                 return callback(ApiResponse::internalError("Failed to delete user."));
            }
            return callback(ApiResponse::noContent());
        }
    );
}