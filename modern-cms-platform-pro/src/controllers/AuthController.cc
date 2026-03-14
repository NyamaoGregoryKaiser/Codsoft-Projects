#include "AuthController.h"
#include "services/UserService.h"
#include "utils/ApiResponse.h"
#include "utils/JwtManager.h"
#include "utils/PasswordHasher.h"

void AuthController::registerUser(const drogon::HttpRequestPtr &req,
                                  std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
    LOG_INFO << "Attempting to register new user.";
    auto json = req->getJsonObject();
    if (!json || !json->isMember("username") || !json->isMember("email") || !json->isMember("password")) {
        return callback(ApiResponse::badRequest("Missing username, email, or password."));
    }

    std::string username = (*json)["username"].asString();
    std::string email = (*json)["email"].asString();
    std::string password = (*json)["password"].asString();

    if (username.empty() || email.empty() || password.empty()) {
        return callback(ApiResponse::badRequest("Username, email, and password cannot be empty."));
    }

    UserService::getInstance()->registerUser(username, email, password,
        [callback](const std::pair<User, std::string>& result, const std::string& error) {
            if (!error.empty()) {
                if (error.find("duplicate key value violates unique constraint") != std::string::npos) {
                     return callback(ApiResponse::conflict("Username or email already exists."));
                }
                LOG_ERROR << "Registration failed: " << error;
                return callback(ApiResponse::internalError("Failed to register user."));
            }
            Json::Value data;
            data["user_id"] = result.first.id;
            data["username"] = result.first.username;
            data["email"] = result.first.email;
            data["token"] = result.second;
            LOG_INFO << "User registered successfully: " << result.first.username;
            return callback(ApiResponse::created("User registered successfully.", data));
        }
    );
}

void AuthController::loginUser(const drogon::HttpRequestPtr &req,
                               std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
    LOG_INFO << "Attempting to log in user.";
    auto json = req->getJsonObject();
    if (!json || (!json->isMember("username") && !json->isMember("email")) || !json->isMember("password")) {
        return callback(ApiResponse::badRequest("Missing username/email or password."));
    }

    std::string identifier = ""; // Can be username or email
    if (json->isMember("username")) {
        identifier = (*json)["username"].asString();
    } else if (json->isMember("email")) {
        identifier = (*json)["email"].asString();
    }
    std::string password = (*json)["password"].asString();

    if (identifier.empty() || password.empty()) {
        return callback(ApiResponse::badRequest("Identifier (username/email) and password cannot be empty."));
    }

    UserService::getInstance()->authenticateUser(identifier, password,
        [callback](const std::pair<User, std::string>& result, const std::string& error) {
            if (!error.empty()) {
                LOG_WARN << "Authentication failed for identifier " << identifier << ": " << error;
                return callback(ApiResponse::unauthorized("Invalid credentials."));
            }
            Json::Value data;
            data["user_id"] = result.first.id;
            data["username"] = result.first.username;
            data["email"] = result.first.email;
            data["role"] = result.first.role;
            data["token"] = result.second;
            LOG_INFO << "User logged in successfully: " << result.first.username;
            return callback(ApiResponse::ok("Login successful.", data));
        }
    );
}