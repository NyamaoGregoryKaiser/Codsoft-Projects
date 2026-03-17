#include "UserController.h"
#include "utils/Logger.h"
#include "database/DbClientManager.h"
#include "common/Constants.h"
#include "common/Enums.h"
#include "services/AuthService.h" // For password hashing if admin updates password

// Drogon ORM includes
#include <drogon/orm/Mapper.h>
#include <drogon/orm/Criteria.h>
#include <drogon/orm/Exception.h>
#include "models/User.h" // Generated User model

namespace cms {

drogon::HttpResponsePtr UserController::createErrorResponse(drogon::HttpStatusCode code, const std::string& message) {
    Json::Value json;
    json["error"] = message;
    auto resp = drogon::HttpResponse::newHttpJsonResponse(json);
    resp->setStatusCode(code);
    return resp;
}

drogon::HttpResponsePtr UserController::createSuccessResponse(const Json::Value& data) {
    auto resp = drogon::HttpResponse::newHttpJsonResponse(data);
    resp->setStatusCode(drogon::k200OK);
    return resp;
}

drogon::HttpResponsePtr UserController::createUserResponseJson(const drogon_model::cms_system::User& user) {
    Json::Value userJson;
    userJson["id"] = user.getId();
    userJson["email"] = user.getEmail();
    userJson["role"] = userRoleToString(user.getRole());
    userJson["createdAt"] = drogon::utils::get </*std::string*/ std::string>(user.getCreatedAt()); // Assuming drogon::orm::Field to_string
    userJson["updatedAt"] = drogon::utils::get </*std::string*/ std::string>(user.getUpdatedAt());
    return createSuccessResponse(userJson);
}

void UserController::getAllUsers(const drogon::HttpRequestPtr& req,
                                 std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    auto dbClient = DbClientManager::instance().getDbClient();
    if (!dbClient) {
        LOG_CRITICAL("Database client unavailable for getAllUsers.");
        return callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }

    drogon::orm::Mapper<drogon_model::cms_system::User> userMapper(dbClient);
    try {
        auto users = userMapper.findAll();
        Json::Value usersArray;
        for (const auto& user : users) {
            Json::Value userJson;
            userJson["id"] = user.getId();
            userJson["email"] = user.getEmail();
            userJson["role"] = userRoleToString(user.getRole());
            userJson["createdAt"] = drogon::utils::get<std::string>(user.getCreatedAt());
            userJson["updatedAt"] = drogon::utils::get<std::string>(user.getUpdatedAt());
            usersArray.append(userJson);
        }
        callback(createSuccessResponse(usersArray));
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR("Database error fetching all users: {}", e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    } catch (const std::exception& e) {
        LOG_CRITICAL("Unhandled exception in getAllUsers endpoint: {}", e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }
}

void UserController::getUserById(const drogon::HttpRequestPtr& req,
                                 std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                                 std::string id) {
    auto dbClient = DbClientManager::instance().getDbClient();
    if (!dbClient) {
        LOG_CRITICAL("Database client unavailable for getUserById.");
        return callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }

    drogon::orm::Mapper<drogon_model::cms_system::User> userMapper(dbClient);
    try {
        auto user = userMapper.findByPrimaryKey(id);
        if (user) {
            callback(createUserResponseJson(*user));
        } else {
            LOG_WARN("User with ID {} not found.", id);
            callback(createErrorResponse(drogon::k404NotFound, ERR_NOT_FOUND));
        }
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR("Database error fetching user by ID {}: {}", id, e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    } catch (const std::exception& e) {
        LOG_CRITICAL("Unhandled exception in getUserById endpoint: {}", e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }
}

void UserController::getUserProfile(const drogon::HttpRequestPtr& req,
                                    std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    std::string userId = req->attributes()->get<std::string>("user_id"); // From AuthMiddleware

    auto dbClient = DbClientManager::instance().getDbClient();
    if (!dbClient) {
        LOG_CRITICAL("Database client unavailable for getUserProfile.");
        return callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }

    drogon::orm::Mapper<drogon_model::cms_system::User> userMapper(dbClient);
    try {
        auto user = userMapper.findByPrimaryKey(userId);
        if (user) {
            callback(createUserResponseJson(*user));
        } else {
            LOG_ERROR("Authenticated user ID {} not found in database. This shouldn't happen.", userId);
            callback(createErrorResponse(drogon::k404NotFound, ERR_NOT_FOUND));
        }
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR("Database error fetching user profile for ID {}: {}", userId, e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    } catch (const std::exception& e) {
        LOG_CRITICAL("Unhandled exception in getUserProfile endpoint: {}", e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }
}

void UserController::updateUser(const drogon::HttpRequestPtr& req,
                                std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                                std::string id) {
    auto dbClient = DbClientManager::instance().getDbClient();
    if (!dbClient) {
        LOG_CRITICAL("Database client unavailable for updateUser.");
        return callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }

    drogon::orm::Mapper<drogon_model::cms_system::User> userMapper(dbClient);
    try {
        auto userOpt = userMapper.findByPrimaryKey(id);
        if (!userOpt) {
            LOG_WARN("Attempt to update non-existent user with ID: {}", id);
            return callback(createErrorResponse(drogon::k404NotFound, ERR_NOT_FOUND));
        }

        drogon_model::cms_system::User userToUpdate = *userOpt; // Make a mutable copy

        auto json = req->getJsonObject();
        if (!json) {
            LOG_WARN("Bad request for updateUser: No JSON body provided.");
            return callback(createErrorResponse(drogon::k400BadRequest, ERR_BAD_REQUEST));
        }

        bool changed = false;
        if (json->isMember("email") && (*json)["email"].isString()) {
            std::string newEmail = (*json)["email"].asString();
            if (newEmail != userToUpdate.getEmail()) {
                // Check if new email already exists for another user
                auto existingUsers = userMapper.findBy(drogon::orm::Criteria("email", drogon::orm::CompareOperator::EQ, newEmail));
                if (!existingUsers.empty() && existingUsers[0].getId() != userToUpdate.getId()) {
                    LOG_WARN("Attempt to update user email to an already existing email: {}", newEmail);
                    return callback(createErrorResponse(drogon::k409Conflict, "Email already in use"));
                }
                userToUpdate.setEmail(newEmail);
                changed = true;
            }
        }
        if (json->isMember("password") && (*json)["password"].isString()) {
            std::string newPassword = (*json)["password"].asString();
            std::string hashedPassword = PasswordHasher::hashPassword(newPassword);
            if (!hashedPassword.empty() && hashedPassword != userToUpdate.getPasswordHash()) {
                userToUpdate.setPasswordHash(hashedPassword);
                changed = true;
            }
        }
        if (json->isMember("role") && (*json)["role"].isString()) {
            cms::UserRole newRole = stringToUserRole((*json)["role"].asString());
            if (newRole != userToUpdate.getRole()) {
                userToUpdate.setRole(newRole);
                changed = true;
            }
        }

        if (changed) {
            userToUpdate.setUpdatedAt(std::chrono::system_clock::now()); // Manually set updated_at
            userMapper.update(userToUpdate);
            LOG_INFO("User ID {} updated by Admin ID {}", id, req->attributes()->get<std::string>("user_id"));
            callback(createUserResponseJson(userToUpdate));
        } else {
            LOG_DEBUG("No changes detected for user ID {} update.", id);
            callback(createSuccessResponse(Json::Value("No changes applied.")));
        }

    } catch (const Json::Exception& e) {
        LOG_ERROR("JSON parsing error during updateUser: {}", e.what());
        callback(createErrorResponse(drogon::k400BadRequest, ERR_BAD_REQUEST));
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR("Database error updating user ID {}: {}", id, e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    } catch (const std::exception& e) {
        LOG_CRITICAL("Unhandled exception in updateUser endpoint: {}", e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }
}

void UserController::deleteUser(const drogon::HttpRequestPtr& req,
                                std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                                std::string id) {
    auto dbClient = DbClientManager::instance().getDbClient();
    if (!dbClient) {
        LOG_CRITICAL("Database client unavailable for deleteUser.");
        return callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }

    std::string adminId = req->attributes()->get<std::string>("user_id");
    if (adminId == id) {
        LOG_WARN("Admin user {} attempted to delete their own account.", adminId);
        return callback(createErrorResponse(drogon::k403Forbidden, "Cannot delete your own admin account."));
    }

    drogon::orm::Mapper<drogon_model::cms_system::User> userMapper(dbClient);
    try {
        size_t rowsAffected = userMapper.deleteByPrimaryKey(id);
        if (rowsAffected > 0) {
            LOG_INFO("User ID {} deleted by Admin ID {}.", id, adminId);
            Json::Value responseJson;
            responseJson["message"] = "User deleted successfully.";
            callback(createSuccessResponse(responseJson));
        } else {
            LOG_WARN("Attempt to delete non-existent user with ID {}.", id);
            callback(createErrorResponse(drogon::k404NotFound, ERR_NOT_FOUND));
        }
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR("Database error deleting user ID {}: {}", id, e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    } catch (const std::exception& e) {
        LOG_CRITICAL("Unhandled exception in deleteUser endpoint: {}", e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }
}

} // namespace cms
```