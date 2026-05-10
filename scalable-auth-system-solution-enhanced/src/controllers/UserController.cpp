```cpp
#include "UserController.h"
#include "../config/Config.h" // Needed for AuthService init

UserController::UserController(std::shared_ptr<Database> db)
    : db_(std::move(db)) {
    // UserController needs AuthService for password hashing/verification when updating user.
    // This highlights a potential dependency cycle or need for factory pattern.
    // For simplicity, we initialize AuthService here, but in a real app,
    // it would be passed from main or a dependency injection container.
    authService_ = std::make_shared<AuthService>(db_);
    LOG_INFO("UserController initialized.");
}

bool UserController::isValidEmail(const std::string& email) const {
    const std::regex email_regex(R"(([^@\s]+)@(([^@\s]+\.)+[^@\s]+))");
    return std::regex_match(email, email_regex);
}

bool UserController::isValidPassword(const std::string& password) const {
    return password.length() >= 8 &&
           std::regex_search(password, std::regex("[A-Z]")) &&
           std::regex_search(password, std::regex("[a-z]")) &&
           std::regex_search(password, std::regex("[0-9]")) &&
           std::regex_search(password, std::regex("[!@#$%^&*()-_+=]"));
}

bool UserController::isValidUsername(const std::string& username) const {
    return !username.empty() && username.length() >= 3 && username.length() <= 50;
}

crow::response UserController::getUserProfile(const crow::request& req, crow::response& res) {
    auto& ctx = req.get_context<AuthMiddleware>();
    if (!ctx.authenticated_user) {
        return JsonUtils::sendError(res, "unauthorized", "Authentication context not found.", 401);
    }

    try {
        User user(db_);
        if (!user.findById(ctx.authenticated_user->user_id)) {
            LOG_ERROR("Authenticated user ID %s not found in DB.", ctx.authenticated_user->user_id.c_str());
            return JsonUtils::sendError(res, "not_found", "User profile not found.", 404);
        }

        crow::json::wvalue data;
        data["id"] = user.getId();
        data["username"] = user.getUsername();
        data["email"] = user.getEmail();
        data["created_at"] = user.getCreatedAt();
        data["updated_at"] = user.getUpdatedAt();

        return JsonUtils::sendSuccess(res, "User profile retrieved successfully.", data);

    } catch (const UserException& e) {
        return JsonUtils::sendError(res, "server_error", e.what(), 500);
    } catch (const std::exception& e) {
        LOG_ERROR("Unhandled exception in getUserProfile: %s", e.what());
        return JsonUtils::sendError(res, "server_error", "An unexpected error occurred.", 500);
    }
}

crow::response UserController::updateUserProfile(const crow::request& req, crow::response& res) {
    auto& ctx = req.get_context<AuthMiddleware>();
    if (!ctx.authenticated_user) {
        return JsonUtils::sendError(res, "unauthorized", "Authentication context not found.", 401);
    }

    crow::json::rvalue json_body = crow::json::load(req.body);
    if (!json_body) {
        return JsonUtils::sendError(res, "bad_request", "Invalid JSON body.", 400);
    }

    try {
        User user(db_);
        if (!user.findById(ctx.authenticated_user->user_id)) {
            LOG_ERROR("Authenticated user ID %s not found for update.", ctx.authenticated_user->user_id.c_str());
            return JsonUtils::sendError(res, "not_found", "User profile not found.", 404);
        }

        bool updated = false;
        std::string new_username = json_body["username"].s();
        std::string new_email = json_body["email"].s();
        std::string new_password = json_body["password"].s();

        if (!new_username.empty() && new_username != user.getUsername()) {
            if (!isValidUsername(new_username)) {
                return JsonUtils::sendError(res, "bad_request", "Username must be between 3 and 50 characters.", 400);
            }
            user.setUsername(new_username);
            updated = true;
        }

        if (!new_email.empty() && new_email != user.getEmail()) {
            if (!isValidEmail(new_email)) {
                return JsonUtils::sendError(res, "bad_request", "Invalid email format.", 400);
            }
            user.setEmail(new_email);
            updated = true;
        }

        if (!new_password.empty()) {
            if (!isValidPassword(new_password)) {
                return JsonUtils::sendError(res, "bad_request", "Password must be at least 8 characters long and contain uppercase, lowercase, digit, and special character.", 400);
            }
            std::string newPasswordHash = authService_->hashPassword(new_password);
            user.setPasswordHash(newPasswordHash);
            updated = true;
        }

        if (updated) {
            if (user.update()) {
                crow::json::wvalue data;
                data["id"] = user.getId();
                data["username"] = user.getUsername();
                data["email"] = user.getEmail();
                data["created_at"] = user.getCreatedAt();
                data["updated_at"] = user.getUpdatedAt();
                return JsonUtils::sendSuccess(res, "User profile updated successfully.", data);
            } else {
                return JsonUtils::sendError(res, "server_error", "Failed to update user profile.", 500);
            }
        } else {
            return JsonUtils::sendSuccess(res, "No changes detected, profile not updated.", user.getUsername(), 200);
        }

    } catch (const UserException& e) {
        if (std::string(e.what()).find("Email already registered") != std::string::npos) {
            return JsonUtils::sendError(res, "conflict", e.what(), 409);
        }
        return JsonUtils::sendError(res, "server_error", e.what(), 500);
    } catch (const AuthException& e) {
         return JsonUtils::sendError(res, "server_error", e.what(), 500);
    } catch (const std::exception& e) {
        LOG_ERROR("Unhandled exception in updateUserProfile: %s", e.what());
        return JsonUtils::sendError(res, "server_error", "An unexpected error occurred.", 500);
    }
}

crow::response UserController::deleteUserProfile(const crow::request& req, crow::response& res) {
    auto& ctx = req.get_context<AuthMiddleware>();
    if (!ctx.authenticated_user) {
        return JsonUtils::sendError(res, "unauthorized", "Authentication context not found.", 401);
    }

    try {
        User user(db_);
        if (!user.findById(ctx.authenticated_user->user_id)) {
            LOG_ERROR("Authenticated user ID %s not found for deletion.", ctx.authenticated_user->user_id.c_str());
            return JsonUtils::sendError(res, "not_found", "User profile not found.", 404);
        }

        if (user.softDelete()) {
            res.code = 204; // No Content for successful deletion
            res.end();
            return res;
        } else {
            return JsonUtils::sendError(res, "server_error", "Failed to delete user profile.", 500);
        }

    } catch (const UserException& e) {
        return JsonUtils::sendError(res, "server_error", e.what(), 500);
    } catch (const std::exception& e) {
        LOG_ERROR("Unhandled exception in deleteUserProfile: %s", e.what());
        return JsonUtils::sendError(res, "server_error", "An unexpected error occurred.", 500);
    }
}
```