```cpp
#include "AuthController.h"

AuthController::AuthController(std::shared_ptr<AuthService> authService, std::shared_ptr<Database> db)
    : authService_(std::move(authService)), db_(std::move(db)) {
    LOG_INFO("AuthController initialized.");
}

bool AuthController::isValidEmail(const std::string& email) const {
    // Basic regex for email validation
    const std::regex email_regex(R"(([^@\s]+)@(([^@\s]+\.)+[^@\s]+))");
    return std::regex_match(email, email_regex);
}

bool AuthController::isValidPassword(const std::string& password) const {
    // Stronger password policy: min 8 chars, at least one uppercase, one lowercase, one digit, one special char
    return password.length() >= 8 &&
           std::regex_search(password, std::regex("[A-Z]")) &&
           std::regex_search(password, std::regex("[a-z]")) &&
           std::regex_search(password, std::regex("[0-9]")) &&
           std::regex_search(password, std::regex("[!@#$%^&*()-_+=]"));
}

bool AuthController::isValidUsername(const std::string& username) const {
    return !username.empty() && username.length() >= 3 && username.length() <= 50;
}

crow::response AuthController::registerUser(const crow::request& req, crow::response& res) {
    crow::json::rvalue json_body = crow::json::load(req.body);
    if (!json_body) {
        return JsonUtils::sendError(res, "bad_request", "Invalid JSON body.", 400);
    }

    std::string username = json_body["username"].s();
    std::string email = json_body["email"].s();
    std::string password = json_body["password"].s();

    if (!isValidUsername(username)) {
        return JsonUtils::sendError(res, "bad_request", "Username must be between 3 and 50 characters.", 400);
    }
    if (!isValidEmail(email)) {
        return JsonUtils::sendError(res, "bad_request", "Invalid email format.", 400);
    }
    if (!isValidPassword(password)) {
        return JsonUtils::sendError(res, "bad_request", "Password must be at least 8 characters long and contain uppercase, lowercase, digit, and special character.", 400);
    }

    try {
        std::string passwordHash = authService_->hashPassword(password);
        User user(db_);
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordHash);

        if (user.create()) {
            return JsonUtils::sendSuccess(res, "User registered successfully.", 201);
        } else {
            return JsonUtils::sendError(res, "server_error", "Failed to register user.", 500);
        }
    } catch (const UserException& e) {
        if (std::string(e.what()).find("Email already registered") != std::string::npos) {
            return JsonUtils::sendError(res, "conflict", e.what(), 409);
        }
        return JsonUtils::sendError(res, "server_error", e.what(), 500);
    } catch (const AuthException& e) {
        return JsonUtils::sendError(res, "server_error", e.what(), 500);
    } catch (const std::exception& e) {
        LOG_ERROR("Unhandled exception in registerUser: %s", e.what());
        return JsonUtils::sendError(res, "server_error", "An unexpected error occurred.", 500);
    }
}

crow::response AuthController::loginUser(const crow::request& req, crow::response& res) {
    crow::json::rvalue json_body = crow::json::load(req.body);
    if (!json_body) {
        return JsonUtils::sendError(res, "bad_request", "Invalid JSON body.", 400);
    }

    std::string email = json_body["email"].s();
    std::string password = json_body["password"].s();

    if (email.empty() || password.empty()) {
        return JsonUtils::sendError(res, "bad_request", "Email and password are required.", 400);
    }

    try {
        User user(db_);
        if (!user.findByEmail(email)) {
            return JsonUtils::sendError(res, "unauthorized", "Invalid email or password.", 401);
        }

        if (!authService_->verifyPassword(password, user.getPasswordHash())) {
            return JsonUtils::sendError(res, "unauthorized", "Invalid email or password.", 401);
        }

        TokenPair tokens = authService_->generateTokens(user.getId(), user.getEmail());

        crow::json::wvalue data;
        data["user_id"] = user.getId();
        data["username"] = user.getUsername();
        data["email"] = user.getEmail();
        data["access_token"] = tokens.accessToken;
        data["refresh_token"] = tokens.refreshToken;
        data["expires_in"] = tokens.expiresIn; // Access token expiration in seconds

        return JsonUtils::sendSuccess(res, "Login successful.", data);

    } catch (const UserException& e) {
        return JsonUtils::sendError(res, "server_error", e.what(), 500);
    } catch (const AuthException& e) {
        return JsonUtils::sendError(res, "server_error", e.what(), 500);
    } catch (const std::exception& e) {
        LOG_ERROR("Unhandled exception in loginUser: %s", e.what());
        return JsonUtils::sendError(res, "server_error", "An unexpected error occurred.", 500);
    }
}

crow::response AuthController::refreshToken(const crow::request& req, crow::response& res) {
    crow::json::rvalue json_body = crow::json::load(req.body);
    if (!json_body) {
        return JsonUtils::sendError(res, "bad_request", "Invalid JSON body.", 400);
    }

    std::string refresh_token = json_body["refresh_token"].s();
    if (refresh_token.empty()) {
        return JsonUtils::sendError(res, "bad_request", "Refresh token is required.", 400);
    }

    try {
        auto decoded_jwt_opt = authService_->verifyRefreshToken(refresh_token);
        if (!decoded_jwt_opt) {
            return JsonUtils::sendError(res, "unauthorized", "Invalid or expired refresh token.", 401);
        }

        auto decoded_jwt = decoded_jwt_opt.value();
        std::string userId = decoded_jwt.get_subject();
        std::string email = decoded_jwt.get_payload_claim("email").as_string();

        User user(db_);
        if (!user.findById(userId)) {
            LOG_WARN("Refresh token issued for non-existent or deleted user ID: %s", userId.c_str());
            return JsonUtils::sendError(res, "unauthorized", "Invalid refresh token (user not found).", 401);
        }

        std::string new_access_token = authService_->generateAccessToken(userId, email);
        
        crow::json::wvalue data;
        data["access_token"] = new_access_token;
        data["expires_in"] = Config::getJwtAccessTokenExpirationSeconds();

        return JsonUtils::sendSuccess(res, "Access token refreshed successfully.", data);

    } catch (const AuthException& e) {
        return JsonUtils::sendError(res, "server_error", e.what(), 500);
    } catch (const std::exception& e) {
        LOG_ERROR("Unhandled exception in refreshToken: %s", e.what());
        return JsonUtils::sendError(res, "server_error", "An unexpected error occurred.", 500);
    }
}
```