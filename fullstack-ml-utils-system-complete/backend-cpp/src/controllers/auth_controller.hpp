#ifndef ML_UTILITIES_SYSTEM_AUTH_CONTROLLER_HPP
#define ML_UTILITIES_SYSTEM_AUTH_CONTROLLER_HPP

#include "crow.h"
#include "nlohmann/json.hpp"
#include "../services/auth_service.hpp"
#include "../middleware/error_middleware.hpp" // For HttpError
#include "../utils/logger.hpp"
#include "../common/constants.hpp"
#include <memory>
#include <stdexcept>

/**
 * @brief Controller for user authentication endpoints (registration, login).
 */
class AuthController {
private:
    std::shared_ptr<AuthService> auth_service;

public:
    /**
     * @brief Constructs an AuthController and registers its routes with the Crow app.
     * @param app A reference to the Crow application instance.
     * @param service Shared pointer to the AuthService.
     */
    AuthController(crow::App<
            LoggingMiddleware,
            ErrorMiddleware,
            AuthMiddleware,
            RateLimitMiddleware
        >& app, std::shared_ptr<AuthService> service)
        : auth_service(std::move(service)) {
        
        if (!auth_service) {
            LOG_CRITICAL("AuthController initialized with a null AuthService.");
            throw std::runtime_error("AuthService cannot be null.");
        }
        LOG_DEBUG("AuthController initialized. Registering routes.");

        // Register User route (Public)
        CROW_ROUTE(app, "/api/auth/register")
            .methods("POST"_method)
            ([this](const crow::request& req) {
            return handleRegister(req);
        });

        // Login User route (Public)
        CROW_ROUTE(app, "/api/auth/login")
            .methods("POST"_method)
            ([this](const crow::request& req) {
            return handleLogin(req);
        });
    }

private:
    /**
     * @brief Handles user registration requests.
     * Expects JSON body with "email" and "password".
     * @param req The Crow request object.
     * @return A Crow response with user info or error.
     */
    crow::response handleRegister(const crow::request& req) {
        LOG_INFO("Received registration request.");
        try {
            auto json_body = nlohmann::json::parse(req.body);
            if (!json_body.contains("email") || !json_body.contains("password")) {
                throw HttpError(crow::BAD_REQUEST, Constants::ERR_INVALID_INPUT);
            }

            std::string email = json_body["email"].get<std::string>();
            std::string password = json_body["password"].get<std::string>();
            std::string role = json_body.contains("role") ? json_body["role"].get<std::string>() : Constants::ROLE_USER;

            if (email.empty() || password.empty()) {
                throw HttpError(crow::BAD_REQUEST, Constants::ERR_INVALID_INPUT);
            }

            User registered_user = auth_service->registerUser(email, password, role);

            nlohmann::json response_body = {
                {"message", "User registered successfully."},
                {"user", registered_user.toJson()}
            };
            return crow::response(crow::CREATED, response_body.dump());
        } catch (const nlohmann::json::parse_error& e) {
            LOG_WARN("Bad JSON in registration request: {}", e.what());
            throw HttpError(crow::BAD_REQUEST, "Invalid JSON body.");
        } catch (const HttpError& e) {
            throw; // Re-throw custom HttpError
        } catch (const std::runtime_error& e) {
            // Catch specific runtime errors from service layer
            if (std::string(e.what()) == Constants::ERR_EMAIL_EXISTS) {
                throw HttpError(crow::CONFLICT, Constants::ERR_EMAIL_EXISTS);
            }
            LOG_ERROR("Error during user registration: {}", e.what());
            throw HttpError(crow::INTERNAL_SERVER_ERROR, Constants::ERR_INTERNAL_SERVER_ERROR);
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception during user registration: {}", e.what());
            throw HttpError(crow::INTERNAL_SERVER_ERROR, Constants::ERR_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * @brief Handles user login requests.
     * Expects JSON body with "email" and "password".
     * @param req The Crow request object.
     * @return A Crow response with JWT token or error.
     */
    crow::response handleLogin(const crow::request& req) {
        LOG_INFO("Received login request.");
        try {
            auto json_body = nlohmann::json::parse(req.body);
            if (!json_body.contains("email") || !json_body.contains("password")) {
                throw HttpError(crow::BAD_REQUEST, Constants::ERR_INVALID_INPUT);
            }

            std::string email = json_body["email"].get<std::string>();
            std::string password = json_body["password"].get<std::string>();

            if (email.empty() || password.empty()) {
                throw HttpError(crow::BAD_REQUEST, Constants::ERR_INVALID_INPUT);
            }

            std::string token = auth_service->loginUser(email, password);

            nlohmann::json response_body = {
                {"message", "Login successful."},
                {"token", token}
            };
            return crow::response(crow::OK, response_body.dump());
        } catch (const nlohmann::json::parse_error& e) {
            LOG_WARN("Bad JSON in login request: {}", e.what());
            throw HttpError(crow::BAD_REQUEST, "Invalid JSON body.");
        } catch (const HttpError& e) {
            throw; // Re-throw custom HttpError
        } catch (const std::runtime_error& e) {
            if (std::string(e.what()) == Constants::ERR_INVALID_CREDENTIALS) {
                throw HttpError(crow::UNAUTHORIZED, Constants::ERR_INVALID_CREDENTIALS);
            }
            LOG_ERROR("Error during user login: {}", e.what());
            throw HttpError(crow::INTERNAL_SERVER_ERROR, Constants::ERR_INTERNAL_SERVER_ERROR);
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception during user login: {}", e.what());
            throw HttpError(crow::INTERNAL_SERVER_ERROR, Constants::ERR_INTERNAL_SERVER_ERROR);
        }
    }
};

#endif // ML_UTILITIES_SYSTEM_AUTH_CONTROLLER_HPP
```