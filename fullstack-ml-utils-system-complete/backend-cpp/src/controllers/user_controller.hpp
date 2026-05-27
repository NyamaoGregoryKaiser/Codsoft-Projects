#ifndef ML_UTILITIES_SYSTEM_USER_CONTROLLER_HPP
#define ML_UTILITIES_SYSTEM_USER_CONTROLLER_HPP

#include "crow.h"
#include "nlohmann/json.hpp"
#include "../services/user_service.hpp"
#include "../middleware/error_middleware.hpp"
#include "../middleware/auth_middleware.hpp"
#include "../utils/logger.hpp"
#include "../common/constants.hpp"
#include <memory>
#include <stdexcept>

/**
 * @brief Controller for user-related API endpoints (profile management).
 * Requires authentication.
 */
class UserController {
private:
    std::shared_ptr<UserService> user_service;

public:
    /**
     * @brief Constructs a UserController and registers its routes with the Crow app.
     * @param app A reference to the Crow application instance.
     * @param service Shared pointer to the UserService.
     */
    UserController(crow::App<
            LoggingMiddleware,
            ErrorMiddleware,
            AuthMiddleware,
            RateLimitMiddleware
        >& app, std::shared_ptr<UserService> service)
        : user_service(std::move(service)) {
        
        if (!user_service) {
            LOG_CRITICAL("UserController initialized with a null UserService.");
            throw std::runtime_error("UserService cannot be null.");
        }
        LOG_DEBUG("UserController initialized. Registering routes.");

        // Get Current User Profile (Authenticated)
        CROW_ROUTE(app, "/api/users/me")
            .methods("GET"_method)
            .template middleware<AuthMiddleware>()
            ([this](const crow::request& req, AuthMiddleware::context& ctx) {
            return handleGetUserProfile(req, ctx);
        });

        // Update Current User Profile (Authenticated)
        CROW_ROUTE(app, "/api/users/me")
            .methods("POST"_method, "PUT"_method)
            .template middleware<AuthMiddleware>()
            ([this](const crow::request& req, AuthMiddleware::context& ctx) {
            return handleUpdateUserProfile(req, ctx);
        });

        // Delete Current User Profile (Authenticated)
        CROW_ROUTE(app, "/api/users/me")
            .methods("DELETE"_method)
            .template middleware<AuthMiddleware>()
            ([this](const crow::request& req, AuthMiddleware::context& ctx) {
            return handleDeleteUserProfile(req, ctx);
        });

        // Get User by ID (Admin Only)
        CROW_ROUTE(app, "/api/users/<int>")
            .methods("GET"_method)
            .template middleware<AuthMiddleware>()
            ([this](const crow::request& req, AuthMiddleware::context& ctx, int user_id) {
            return handleGetUserById(req, ctx, user_id);
        });
    }

private:
    /**
     * @brief Handles requests to get the profile of the currently authenticated user.
     * @param req The Crow request object.
     * @param ctx The AuthMiddleware context containing authenticated user info.
     * @return A Crow response with user profile or error.
     */
    crow::response handleGetUserProfile(const crow::request& req, AuthMiddleware::context& ctx) {
        LOG_INFO("Received request for user profile for ID {}.", ctx.user_id);
        try {
            std::optional<User> user_opt = user_service->getUserById(ctx.user_id);

            if (!user_opt) {
                // This case should ideally not happen if user_id came from a valid token
                LOG_ERROR("Authenticated user ID {} not found in database. Token may be stale.", ctx.user_id);
                throw HttpError(crow::NOT_FOUND, Constants::ERR_USER_NOT_FOUND);
            }

            nlohmann::json response_body = user_opt->toJson();
            return crow::response(crow::OK, response_body.dump());
        } catch (const HttpError& e) {
            throw;
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception getting user profile for ID {}: {}", ctx.user_id, e.what());
            throw HttpError(crow::INTERNAL_SERVER_ERROR, Constants::ERR_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * @brief Handles requests to update the profile of the currently authenticated user.
     * Allows updating email, password, and role (admin only for role change).
     * @param req The Crow request object.
     * @param ctx The AuthMiddleware context containing authenticated user info.
     * @return A Crow response with updated user profile or error.
     */
    crow::response handleUpdateUserProfile(const crow::request& req, AuthMiddleware::context& ctx) {
        LOG_INFO("Received request to update user profile for ID {}.", ctx.user_id);
        try {
            auto json_body = nlohmann::json::parse(req.body);

            std::optional<std::string> new_email;
            if (json_body.contains("email")) {
                new_email = json_body["email"].get<std::string>();
                if (new_email->empty()) throw HttpError(crow::BAD_REQUEST, Constants::ERR_INVALID_INPUT);
            }

            std::optional<std::string> new_password;
            if (json_body.contains("password")) {
                new_password = json_body["password"].get<std::string>();
                 if (new_password->empty()) throw HttpError(crow::BAD_REQUEST, Constants::ERR_INVALID_INPUT);
            }

            std::optional<std::string> new_role;
            if (json_body.contains("role")) {
                new_role = json_body["role"].get<std::string>();
                if (new_role->empty()) throw HttpError(crow::BAD_REQUEST, Constants::ERR_INVALID_INPUT);

                // Only allow admins to change roles
                if (!ctx.hasRole(Constants::ROLE_ADMIN) && *new_role != ctx.user_role) {
                    throw HttpError(crow::FORBIDDEN, "Only administrators can change user roles.");
                }
            }

            User updated_user = user_service->updateUserProfile(ctx.user_id, new_email, new_password, new_role);

            nlohmann::json response_body = {
                {"message", "User profile updated successfully."},
                {"user", updated_user.toJson()}
            };
            return crow::response(crow::OK, response_body.dump());
        } catch (const nlohmann::json::parse_error& e) {
            LOG_WARN("Bad JSON in update profile request for ID {}: {}", ctx.user_id, e.what());
            throw HttpError(crow::BAD_REQUEST, "Invalid JSON body.");
        } catch (const HttpError& e) {
            throw;
        } catch (const std::runtime_error& e) {
            if (std::string(e.what()) == Constants::ERR_USER_NOT_FOUND) {
                throw HttpError(crow::NOT_FOUND, Constants::ERR_USER_NOT_FOUND);
            } else if (std::string(e.what()) == Constants::ERR_EMAIL_EXISTS) {
                throw HttpError(crow::CONFLICT, Constants::ERR_EMAIL_EXISTS);
            }
            LOG_ERROR("Error updating user profile for ID {}: {}", ctx.user_id, e.what());
            throw HttpError(crow::INTERNAL_SERVER_ERROR, Constants::ERR_INTERNAL_SERVER_ERROR);
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception updating user profile for ID {}: {}", ctx.user_id, e.what());
            throw HttpError(crow::INTERNAL_SERVER_ERROR, Constants::ERR_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * @brief Handles requests to delete the profile of the currently authenticated user.
     * @param req The Crow request object.
     * @param ctx The AuthMiddleware context containing authenticated user info.
     * @return A Crow response indicating success or error.
     */
    crow::response handleDeleteUserProfile(const crow::request& req, AuthMiddleware::context& ctx) {
        LOG_INFO("Received request to delete user profile for ID {}.", ctx.user_id);
        try {
            if (!user_service->deleteUser(ctx.user_id)) {
                LOG_WARN("Delete profile failed: User with ID {} not found.", ctx.user_id);
                throw HttpError(crow::NOT_FOUND, Constants::ERR_USER_NOT_FOUND);
            }

            nlohmann::json response_body = {{"message", "User profile deleted successfully."}};
            return crow::response(crow::OK, response_body.dump());
        } catch (const HttpError& e) {
            throw;
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception deleting user profile for ID {}: {}", ctx.user_id, e.what());
            throw HttpError(crow::INTERNAL_SERVER_ERROR, Constants::ERR_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * @brief Handles requests to get a user profile by ID (admin only).
     * @param req The Crow request object.
     * @param ctx The AuthMiddleware context containing authenticated user info.
     * @param user_id The ID of the user to retrieve.
     * @return A Crow response with user profile or error.
     */
    crow::response handleGetUserById(const crow::request& req, AuthMiddleware::context& ctx, int user_id) {
        LOG_INFO("Received request for user profile ID {} by admin user {}.", user_id, ctx.user_id);
        try {
            // Role-based access control
            if (!ctx.hasRole(Constants::ROLE_ADMIN)) {
                throw HttpError(crow::FORBIDDEN, Constants::ERR_FORBIDDEN);
            }

            std::optional<User> user_opt = user_service->getUserById(user_id);
            if (!user_opt) {
                LOG_WARN("Admin request failed: User with ID {} not found.", user_id);
                throw HttpError(crow::NOT_FOUND, Constants::ERR_USER_NOT_FOUND);
            }

            nlohmann::json response_body = user_opt->toJson();
            return crow::response(crow::OK, response_body.dump());
        } catch (const HttpError& e) {
            throw;
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception getting user ID {} by admin {}: {}", user_id, ctx.user_id, e.what());
            throw HttpError(crow::INTERNAL_SERVER_ERROR, Constants::ERR_INTERNAL_SERVER_ERROR);
        }
    }
};

#endif // ML_UTILITIES_SYSTEM_USER_CONTROLLER_HPP
```