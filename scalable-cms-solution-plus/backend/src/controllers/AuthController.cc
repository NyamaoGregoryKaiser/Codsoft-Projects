#include "AuthController.h"
#include "services/AuthService.h"
#include "utils/Logger.h"
#include "common/Constants.h"
#include <drogon/HttpAppFramework.h>

namespace cms {

drogon::HttpResponsePtr AuthController::createErrorResponse(drogon::HttpStatusCode code, const std::string& message) {
    Json::Value json;
    json["error"] = message;
    auto resp = drogon::HttpResponse::newHttpJsonResponse(json);
    resp->setStatusCode(code);
    return resp;
}

drogon::HttpResponsePtr AuthController::createSuccessResponse(const Json::Value& data) {
    auto resp = drogon::HttpResponse::newHttpJsonResponse(data);
    resp->setStatusCode(drogon::k200OK);
    return resp;
}

void AuthController::registerUser(const drogon::HttpRequestPtr& req,
                                  std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    try {
        auto json = req->getJsonObject();
        if (!json || !json->isMember("email") || !json->isMember("password")) {
            LOG_WARN("Bad request for register: Missing email or password.");
            return callback(createErrorResponse(drogon::k400BadRequest, ERR_BAD_REQUEST));
        }

        std::string email = (*json)["email"].asString();
        std::string password = (*json)["password"].asString();

        if (email.empty() || password.empty()) {
            LOG_WARN("Bad request for register: Empty email or password.");
            return callback(createErrorResponse(drogon::k400BadRequest, ERR_BAD_REQUEST));
        }

        // Optional: specify role for registration, default to USER if not provided
        UserRole role = UserRole::USER;
        if (json->isMember("role")) {
            role = stringToUserRole((*json)["role"].asString());
        }

        auto user = AuthService::instance().registerUser(email, password, role);

        if (user) {
            Json::Value responseJson;
            responseJson["message"] = "User registered successfully";
            responseJson["userId"] = user->getId();
            responseJson["email"] = user->getEmail();
            responseJson["role"] = userRoleToString(user->getRole());
            LOG_INFO("User {} registered with role {}", user->getEmail(), userRoleToString(user->getRole()));
            callback(createSuccessResponse(responseJson));
        } else {
            LOG_WARN("User registration failed for {}: likely user exists or internal error.", email);
            callback(createErrorResponse(drogon::k409Conflict, ERR_USER_EXISTS)); // 409 Conflict
        }

    } catch (const Json::Exception& e) {
        LOG_ERROR("JSON parsing error during register: {}", e.what());
        callback(createErrorResponse(drogon::k400BadRequest, ERR_BAD_REQUEST));
    } catch (const std::exception& e) {
        LOG_CRITICAL("Unhandled exception in register endpoint: {}", e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }
}

void AuthController::login(const drogon::HttpRequestPtr& req,
                           std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    try {
        auto json = req->getJsonObject();
        if (!json || !json->isMember("email") || !json->isMember("password")) {
            LOG_WARN("Bad request for login: Missing email or password.");
            return callback(createErrorResponse(drogon::k400BadRequest, ERR_BAD_REQUEST));
        }

        std::string email = (*json)["email"].asString();
        std::string password = (*json)["password"].asString();

        if (email.empty() || password.empty()) {
            LOG_WARN("Bad request for login: Empty email or password.");
            return callback(createErrorResponse(drogon::k400BadRequest, ERR_BAD_REQUEST));
        }

        auto loginResponse = AuthService::instance().loginUser(email, password);

        if (loginResponse) {
            Json::Value responseJson;
            responseJson["userId"] = loginResponse->userId;
            responseJson["accessToken"] = loginResponse->accessToken;
            responseJson["refreshToken"] = loginResponse->refreshToken;
            responseJson["role"] = userRoleToString(loginResponse->role);
            LOG_INFO("User {} logged in, assigned role {}", email, userRoleToString(loginResponse->role));
            callback(createSuccessResponse(responseJson));
        } else {
            LOG_WARN("Login failed for {}: Invalid credentials.", email);
            callback(createErrorResponse(drogon::k401Unauthorized, ERR_INVALID_CREDENTIALS));
        }

    } catch (const Json::Exception& e) {
        LOG_ERROR("JSON parsing error during login: {}", e.what());
        callback(createErrorResponse(drogon::k400BadRequest, ERR_BAD_REQUEST));
    } catch (const std::exception& e) {
        LOG_CRITICAL("Unhandled exception in login endpoint: {}", e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }
}

void AuthController::refresh(const drogon::HttpRequestPtr& req,
                             std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    try {
        auto json = req->getJsonObject();
        if (!json || !json->isMember("refreshToken")) {
            LOG_WARN("Bad request for refresh: Missing refreshToken.");
            return callback(createErrorResponse(drogon::k400BadRequest, ERR_BAD_REQUEST));
        }

        std::string refreshToken = (*json)["refreshToken"].asString();

        if (refreshToken.empty()) {
            LOG_WARN("Bad request for refresh: Empty refreshToken.");
            return callback(createErrorResponse(drogon::k400BadRequest, ERR_BAD_REQUEST));
        }

        auto loginResponse = AuthService::instance().refreshTokens(refreshToken);

        if (loginResponse) {
            Json::Value responseJson;
            responseJson["userId"] = loginResponse->userId;
            responseJson["accessToken"] = loginResponse->accessToken;
            responseJson["refreshToken"] = loginResponse->refreshToken;
            responseJson["role"] = userRoleToString(loginResponse->role);
            LOG_INFO("Tokens refreshed for user ID: {}", loginResponse->userId);
            callback(createSuccessResponse(responseJson));
        } else {
            LOG_WARN("Token refresh failed. Invalid or expired refresh token.");
            callback(createErrorResponse(drogon::k401Unauthorized, ERR_INVALID_TOKEN));
        }

    } catch (const Json::Exception& e) {
        LOG_ERROR("JSON parsing error during refresh: {}", e.what());
        callback(createErrorResponse(drogon::k400BadRequest, ERR_BAD_REQUEST));
    } catch (const std::exception& e) {
        LOG_CRITICAL("Unhandled exception in refresh endpoint: {}", e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }
}

void AuthController::logout(const drogon::HttpRequestPtr& req,
                            std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    try {
        // AuthMiddleware ensures we have a valid access token.
        // The user ID should already be in request attributes.
        std::string userId = req->attributes()->get<std::string>("user_id");
        LOG_INFO("User {} is attempting to logout.", userId);

        std::string accessToken = req->getHeader("Authorization").substr(7); // "Bearer "
        
        // Refresh token might be sent in the body for full invalidation
        std::string refreshToken = "";
        auto json = req->getJsonObject();
        if (json && json->isMember("refreshToken")) {
            refreshToken = (*json)["refreshToken"].asString();
        }

        AuthService::instance().logoutUser(accessToken, refreshToken);

        Json::Value responseJson;
        responseJson["message"] = "Logged out successfully.";
        callback(createSuccessResponse(responseJson));

    } catch (const Json::Exception& e) {
        LOG_ERROR("JSON parsing error during logout: {}", e.what());
        callback(createErrorResponse(drogon::k400BadRequest, ERR_BAD_REQUEST));
    } catch (const std::exception& e) {
        LOG_CRITICAL("Unhandled exception in logout endpoint: {}", e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }
}

} // namespace cms
```