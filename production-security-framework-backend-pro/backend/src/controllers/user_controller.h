#pragma once

#include <crow.h>
#include <nlohmann/json.hpp>
#include "../services/user_service.h"
#include "../utils/logger.h"
#include "../utils/custom_exceptions.h"
#include "../middleware/auth_middleware.h"
#include "../middleware/rbac_middleware.h"

namespace Controllers {

class UserController {
public:
    UserController(Services::UserService& user_service) : user_service_(user_service) {}

    // Type definition for the Crow App with all necessary middlewares
    using AppType = crow::App<
        Middleware::ErrorHandler,
        Middleware::RateLimit,
        Middleware::Auth
    >;
    
    void setupRoutes(AppType& app) {
        // Get current authenticated user's profile
        CROW_ROUTE(app, "/users/me").methods(crow::HTTPMethod::GET)
        (Middleware::Auth{}, [this](const crow::request& req, AppType::context& ctx) {
            LOG_DEBUG("Get /users/me request received for user ID: {}", ctx.template get<Middleware::Auth>().user_id);
            Models::User user = user_service_.getUserById(ctx.template get<Middleware::Auth>().user_id);
            // Censor sensitive data before sending
            user.password_hash = "[REDACTED]";
            return crow::response(200, nlohmann::json(user).dump());
        });

        // Get user by ID (Admin only)
        CROW_ROUTE(app, "/users/<string>").methods(crow::HTTPMethod::GET)
        (Middleware::Auth{}, Middleware::RBAC({"ADMIN"}), [this](const crow::request& req, AppType::context& ctx, std::string user_id) {
            LOG_DEBUG("Get /users/{} request by Admin user ID: {}", user_id, ctx.template get<Middleware::Auth>().user_id);
            Models::User user = user_service_.getUserById(user_id);
            user.password_hash = "[REDACTED]"; // Censor
            return crow::response(200, nlohmann::json(user).dump());
        });

        // Update user by ID (Admin only)
        CROW_ROUTE(app, "/users/<string>").methods(crow::HTTPMethod::PUT)
        (Middleware::Auth{}, Middleware::RBAC({"ADMIN"}), [this](const crow::request& req, AppType::context& ctx, std::string user_id) {
            LOG_DEBUG("PUT /users/{} request by Admin user ID: {}", user_id, ctx.template get<Middleware::Auth>().user_id);
            nlohmann::json req_body = nlohmann::json::parse(req.body);

            if (!req_body.contains("email") || !req_body.contains("role")) {
                throw CustomExceptions::BadRequestException("Email and role are required for user update.");
            }

            std::string email = req_body["email"].get<std::string>();
            std::string role = req_body["role"].get<std::string>();
            std::optional<std::string> new_password;
            if (req_body.contains("password") && !req_body["password"].is_null()) {
                new_password = req_body["password"].get<std::string>();
            }

            Models::User updated_user = user_service_.updateUserDetails(user_id, email, new_password, role);
            updated_user.password_hash = "[REDACTED]"; // Censor
            return crow::response(200, nlohmann::json(updated_user).dump());
        });

        // Delete user by ID (Admin only)
        CROW_ROUTE(app, "/users/<string>").methods(crow::HTTPMethod::DELETE)
        (Middleware::Auth{}, Middleware::RBAC({"ADMIN"}), [this](const crow::request& req, AppType::context& ctx, std::string user_id) {
            LOG_DEBUG("DELETE /users/{} request by Admin user ID: {}", user_id, ctx.template get<Middleware::Auth>().user_id);
            user_service_.deleteUser(user_id);
            return crow::response(204); // No content
        });
    }

private:
    Services::UserService& user_service_;
};

} // namespace Controllers