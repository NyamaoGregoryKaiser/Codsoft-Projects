```cpp
#include "UserController.h"
#include "services/UserService.h"
#include "utils/Logger.h"
#include "models/User.h" // For User model
#include <drogon/HttpAppFramework.h> // For app().getDbClient()
#include <drogon/orm/Mapper.h>

namespace ApexContent::Controller {

bool UserController::isAdmin(const ApexContent::Filter::AuthData& authData) const {
    return std::find(authData.roles.begin(), authData.roles.end(), "admin") != authData.roles.end();
}

bool UserController::hasAccess(const ApexContent::Filter::AuthData& authData, int targetUserId) const {
    return isAdmin(authData) || (authData.userId == targetUserId);
}

void UserController::getUsers(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    LOG_DEBUG << "UserController::getUsers called.";
    auto authDataOpt = ApexContent::Filter::AuthFilter::getAuthData(req);
    if (!authDataOpt || !isAdmin(authDataOpt.value())) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k403Forbidden);
        resp->setBody("Forbidden: Admin access required.");
        callback(resp);
        return;
    }

    try {
        Json::Value usersJson = ApexContent::Service::UserService::getAllUsers();
        auto resp = drogon::HttpResponse::newHttpJsonResponse(usersJson);
        resp->setStatusCode(drogon::k200OK);
        callback(resp);
    } catch (const std::exception& e) {
        LOG_ERROR << "Error getting all users: " << e.what();
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k500InternalServerError);
        resp->setBody("Internal server error: " + std::string(e.what()));
        callback(resp);
    }
}

void UserController::getUserById(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback, int userId) {
    LOG_DEBUG << "UserController::getUserById called for ID: " << userId;
    auto authDataOpt = ApexContent::Filter::AuthFilter::getAuthData(req);
    if (!authDataOpt || !hasAccess(authDataOpt.value(), userId)) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k403Forbidden);
        resp->setBody("Forbidden: Admin access or self-access required.");
        callback(resp);
        return;
    }

    try {
        Json::Value userJson = ApexContent::Service::UserService::getUserById(userId);
        auto resp = drogon::HttpResponse::newHttpJsonResponse(userJson);
        resp->setStatusCode(drogon::k200OK);
        callback(resp);
    } catch (const std::runtime_error& e) {
        if (std::string(e.what()) == "User not found") {
            auto resp = drogon::HttpResponse::newHttpResponse();
            resp->setStatusCode(drogon::k404NotFound);
            resp->setBody(e.what());
            callback(resp);
        } else {
            LOG_ERROR << "Error getting user " << userId << ": " << e.what();
            auto resp = drogon::HttpResponse::newHttpResponse();
            resp->setStatusCode(drogon::k500InternalServerError);
            resp->setBody("Internal server error: " + std::string(e.what()));
            callback(resp);
        }
    }
}

void UserController::createUser(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    LOG_DEBUG << "UserController::createUser called.";
    auto authDataOpt = ApexContent::Filter::AuthFilter::getAuthData(req);
    if (!authDataOpt || !isAdmin(authDataOpt.value())) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k403Forbidden);
        resp->setBody("Forbidden: Admin access required to create users.");
        callback(resp);
        return;
    }

    Json::Value json;
    try {
        json = *(req->get                    ());
    } catch (const std::exception& e) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k400BadRequest);
        resp->setBody("Invalid JSON body.");
        callback(resp);
        return;
    }

    if (!json.isMember("username") || !json.isMember("email") || !json.isMember("password") || !json.isMember("roleNames")) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k400BadRequest);
        resp->setBody("Missing username, email, password, or roleNames.");
        callback(resp);
        return;
    }
    
    std::vector<std::string> roleNames;
    if (json["roleNames"].isArray()) {
        for (const auto& role : json["roleNames"]) {
            roleNames.push_back(role.asString());
        }
    } else {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k400BadRequest);
        resp->setBody("roleNames must be an array of strings.");
        callback(resp);
        return;
    }

    try {
        Json::Value newUserJson = ApexContent::Service::UserService::createUser(
            json["username"].asString(),
            json["email"].asString(),
            json["password"].asString(),
            roleNames
        );
        auto resp = drogon::HttpResponse::newHttpJsonResponse(newUserJson);
        resp->setStatusCode(drogon::k201Created);
        callback(resp);
    } catch (const std::runtime_error& e) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        if (std::string(e.what()).find("already exists") != std::string::npos ||
            std::string(e.what()).find("Role not found") != std::string::npos) {
            resp->setStatusCode(drogon::k409Conflict); // Conflict or bad request if role doesn't exist
        } else {
            resp->setStatusCode(drogon::k500InternalServerError);
        }
        resp->setBody(e.what());
        callback(resp);
    }
}

void UserController::updateUser(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback, int userId) {
    LOG_DEBUG << "UserController::updateUser called for ID: " << userId;
    auto authDataOpt = ApexContent::Filter::AuthFilter::getAuthData(req);
    if (!authDataOpt || !hasAccess(authDataOpt.value(), userId)) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k403Forbidden);
        resp->setBody("Forbidden: Admin access or self-access required.");
        callback(resp);
        return;
    }

    Json::Value json;
    try {
        json = *(req->get                    ());
    } catch (const std::exception& e) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k400BadRequest);
        resp->setBody("Invalid JSON body.");
        callback(resp);
        return;
    }
    
    try {
        Json::Value updatedUserJson = ApexContent::Service::UserService::updateUser(userId, json, isAdmin(authDataOpt.value()));
        auto resp = drogon::HttpResponse::newHttpJsonResponse(updatedUserJson);
        resp->setStatusCode(drogon::k200OK);
        callback(resp);
    } catch (const std::runtime_error& e) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        if (std::string(e.what()) == "User not found") {
            resp->setStatusCode(drogon::k404NotFound);
        } else if (std::string(e.what()).find("already exists") != std::string::npos) {
             resp->setStatusCode(drogon::k409Conflict);
        } else if (std::string(e.what()).find("Role not found") != std::string::npos) {
             resp->setStatusCode(drogon::k400BadRequest); // Bad request for invalid role
        } else {
            resp->setStatusCode(drogon::k500InternalServerError);
        }
        resp->setBody(e.what());
        callback(resp);
    }
}

void UserController::deleteUser(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback, int userId) {
    LOG_DEBUG << "UserController::deleteUser called for ID: " << userId;
    auto authDataOpt = ApexContent::Filter::AuthFilter::getAuthData(req);
    if (!authDataOpt || !isAdmin(authDataOpt.value())) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k403Forbidden);
        resp->setBody("Forbidden: Admin access required to delete users.");
        callback(resp);
        return;
    }
    
    // Prevent admin from deleting themselves
    if (authDataOpt.value().userId == userId) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k403Forbidden);
        resp->setBody("Forbidden: Cannot delete your own account.");
        callback(resp);
        return;
    }

    try {
        ApexContent::Service::UserService::deleteUser(userId);
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k204NoContent); // 204 No Content
        callback(resp);
    } catch (const std::runtime_error& e) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        if (std::string(e.what()) == "User not found") {
            resp->setStatusCode(drogon::k404NotFound);
        } else {
            LOG_ERROR << "Error deleting user " << userId << ": " << e.what();
            resp->setStatusCode(drogon::k500InternalServerError);
        }
        resp->setBody(e.what());
        callback(resp);
    }
}

} // namespace ApexContent::Controller
```