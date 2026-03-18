#include "AuthController.h"
#include "common/JsonUtils.h"
#include "common/ErrorHandling.h"
#include "config/AppConfig.h"
#include "spdlog/spdlog.h"
#include <jwt-cpp/jwt.h>

// Initialize static service instance
UserService AuthController::user_service;

std::string AuthController::generateJwtToken(const std::string& user_id) {
    auto token = jwt::create()
        .set_issuer("ml-utilities-api")
        .set_type("JWT")
        .set_subject(user_id)
        .set_payload_claim("user_id", jwt::claim(user_id))
        .set_issued_at(std::chrono::system_clock::now())
        .set_expires_at(std::chrono::system_clock::now() + std::chrono::hours(24)) // 24-hour expiry
        .sign(jwt::algorithm::hs256{AppConfig::getInstance().getJwtSecret()});
    return token;
}

crow::response AuthController::registerUser(const crow::request& req) {
    crow::response res;
    try {
        nlohmann::json body = JsonUtils::parseRequestBody(req);

        if (!body.contains("username") || !body.contains("email") || !body.contains("password")) {
            throw BadRequestError("Missing username, email, or password.");
        }

        std::string username = body["username"].get<std::string>();
        std::string email = body["email"].get<std::string>();
        std::string password = body["password"].get<std::string>();

        // Basic validation (more robust validation should be implemented)
        if (username.empty() || email.empty() || password.empty()) {
            throw BadRequestError("Username, email, and password cannot be empty.");
        }
        if (password.length() < 6) { // Example password policy
            throw BadRequestError("Password must be at least 6 characters long.");
        }

        User new_user = user_service.createUser(username, email, password);
        std::string token = generateJwtToken(new_user.id);

        nlohmann::json response_data;
        response_data["token"] = token;
        response_data["user"] = new_user.toJson();

        JsonUtils::sendSuccessResponse(res, crow::HTTPResponseCode::Created, response_data);
    } catch (const std::exception& e) {
        handle_exception(res, e);
    }
    return res;
}

crow::response AuthController::loginUser(const crow::request& req) {
    crow::response res;
    try {
        nlohmann::json body = JsonUtils::parseRequestBody(req);

        if (!body.contains("email") || !body.contains("password")) {
            throw BadRequestError("Missing email or password.");
        }

        std::string email = body["email"].get<std::string>();
        std::string password = body["password"].get<std::string>();

        std::optional<User> user_opt = user_service.getUserByEmail(email);
        if (!user_opt.has_value()) {
            throw UnauthorizedError("Invalid credentials.");
        }

        User user = user_opt.value();
        if (!user_service.verifyPassword(password, user.password_hash)) {
            throw UnauthorizedError("Invalid credentials.");
        }

        std::string token = generateJwtToken(user.id);

        nlohmann::json response_data;
        response_data["token"] = token;
        response_data["user"] = user.toJson();

        JsonUtils::sendSuccessResponse(res, crow::HTTPResponseCode::OK, response_data);
    } catch (const std::exception& e) {
        handle_exception(res, e);
    }
    return res;
}
```