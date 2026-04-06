#pragma once

#include <crow.h>
#include <nlohmann/json.hpp>
#include "../services/auth_service.h"
#include "../utils/logger.h"
#include "../utils/custom_exceptions.h"

namespace Controllers {

class AuthController {
public:
    AuthController(Services::AuthService& auth_service) : auth_service_(auth_service) {}

    void setupRoutes(crow::App<
        Middleware::ErrorHandler,
        Middleware::RateLimit
    >& app) {
        CROW_ROUTE(app, "/auth/register").methods(crow::HTTPMethod::POST)
        ([this](const crow::request& req) {
            LOG_DEBUG("Register request received.");
            nlohmann::json req_body = nlohmann::json::parse(req.body);

            if (!req_body.contains("email") || !req_body.contains("password") || !req_body.contains("role")) {
                throw CustomExceptions::BadRequestException("Email, password, and role are required for registration.");
            }

            std::string email = req_body["email"].get<std::string>();
            std::string password = req_body["password"].get<std::string>();
            std::string role = req_body["role"].get<std::string>();

            Services::AuthTokens tokens = auth_service_.registerUser(email, password, role);

            nlohmann::json response_json;
            response_json["accessToken"] = tokens.accessToken;
            response_json["refreshToken"] = tokens.refreshToken;
            return crow::response(201, response_json.dump());
        });

        CROW_ROUTE(app, "/auth/login").methods(crow::HTTPMethod::POST)
        ([this](const crow::request& req) {
            LOG_DEBUG("Login request received.");
            nlohmann::json req_body = nlohmann::json::parse(req.body);

            if (!req_body.contains("email") || !req_body.contains("password")) {
                throw CustomExceptions::BadRequestException("Email and password are required for login.");
            }

            std::string email = req_body["email"].get<std::string>();
            std::string password = req_body["password"].get<std::string>();

            Services::AuthTokens tokens = auth_service_.loginUser(email, password);

            nlohmann::json response_json;
            response_json["accessToken"] = tokens.accessToken;
            response_json["refreshToken"] = tokens.refreshToken;
            return crow::response(200, response_json.dump());
        });

        CROW_ROUTE(app, "/auth/refresh").methods(crow::HTTPMethod::POST)
        ([this](const crow::request& req) {
            LOG_DEBUG("Token refresh request received.");
            nlohmann::json req_body = nlohmann::json::parse(req.body);

            if (!req_body.contains("refreshToken")) {
                throw CustomExceptions::BadRequestException("Refresh token is required.");
            }

            std::string refresh_token = req_body["refreshToken"].get<std::string>();

            Services::AuthTokens tokens = auth_service_.refreshUserTokens(refresh_token);

            nlohmann::json response_json;
            response_json["accessToken"] = tokens.accessToken;
            response_json["refreshToken"] = tokens.refreshToken;
            return crow::response(200, response_json.dump());
        });
    }

private:
    Services::AuthService& auth_service_;
};

} // namespace Controllers