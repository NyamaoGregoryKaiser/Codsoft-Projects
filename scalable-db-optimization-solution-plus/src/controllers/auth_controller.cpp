```cpp
#include "auth_controller.h"

AuthController::AuthController(crow::SimpleApp& app, std::shared_ptr<AuthService> auth_service)
    : auth_service_(auth_service) {
    setup_routes(app);
}

void AuthController::setup_routes(crow::SimpleApp& app) {
    CROW_ROUTE(app, "/auth/register").methods("POST"_method)
    ([this](const crow::request& req) {
        try {
            auto json_body = crow::json::load(req.body);
            if (!json_body || !json_body.has("username") || !json_body.has("email") || !json_body.has("password")) {
                throw BadRequestException("Missing username, email, or password in request body.");
            }

            std::string username = json_body["username"].s();
            std::string email = json_body["email"].s();
            std::string password = json_body["password"].s();

            User user = auth_service_->register_user(username, email, password);
            crow::response res(crow::CREATED, user.to_json().dump());
            res.set_header("Content-Type", "application/json");
            return res;
        } catch (const BadRequestException& e) {
            return crow::response(crow::BAD_REQUEST, to_json({{"error", e.what()}}).dump());
        } catch (const ConflictException& e) {
            return crow::response(crow::CONFLICT, to_json({{"error", e.what()}}).dump());
        } catch (const DatabaseException& e) {
            LOG_ERROR("Database error in /auth/register: {}", e.what());
            return crow::response(crow::INTERNAL_SERVER_ERROR, to_json({{"error", "Database error during registration."}}).dump());
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception in /auth/register: {}", e.what());
            return crow::response(crow::INTERNAL_SERVER_ERROR, to_json({{"error", "Internal server error during registration."}}).dump());
        }
    });

    CROW_ROUTE(app, "/auth/login").methods("POST"_method)
    ([this](const crow::request& req) {
        try {
            auto json_body = crow::json::load(req.body);
            if (!json_body || !json_body.has("username") || !json_body.has("password")) {
                throw BadRequestException("Missing username or password in request body.");
            }

            std::string username = json_body["username"].s();
            std::string password = json_body["password"].s();

            std::string token = auth_service_->login_user(username, password);
            crow::response res(crow::OK, to_json({{"token", token}}).dump());
            res.set_header("Content-Type", "application/json");
            return res;
        } catch (const BadRequestException& e) {
            return crow::response(crow::BAD_REQUEST, to_json({{"error", e.what()}}).dump());
        } catch (const UnauthorizedException& e) {
            return crow::response(crow::UNAUTHORIZED, to_json({{"error", e.what()}}).dump());
        } catch (const DatabaseException& e) {
            LOG_ERROR("Database error in /auth/login: {}", e.what());
            return crow::response(crow::INTERNAL_SERVER_ERROR, to_json({{"error", "Database error during login."}}).dump());
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception in /auth/login: {}", e.what());
            return crow::response(crow::INTERNAL_SERVER_ERROR, to_json({{"error", "Internal server error during login."}}).dump());
        }
    });
}
```