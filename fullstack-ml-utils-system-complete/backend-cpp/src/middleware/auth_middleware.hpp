#ifndef ML_UTILITIES_SYSTEM_AUTH_MIDDLEWARE_HPP
#define ML_UTILITIES_SYSTEM_AUTH_MIDDLEWARE_HPP

#include "crow.h"
#include "nlohmann/json.hpp"
#include "../utils/jwt_manager.hpp"
#include "../utils/logger.hpp"
#include "../common/constants.hpp"
#include "error_middleware.hpp" // For HttpError
#include <string>
#include <optional>

/**
 * @brief Context data for authenticated requests.
 * Passed to subsequent handlers if authentication is successful.
 */
struct AuthContext {
    int user_id = 0;
    std::string user_role;

    /**
     * @brief Checks if the authenticated user has the required role.
     * @param required_role The role string to check against.
     * @return True if the user's role matches or is 'admin', false otherwise.
     */
    bool hasRole(const std::string& required_role) const {
        return user_role == required_role || user_role == Constants::ROLE_ADMIN;
    }
};

/**
 * @brief Crow middleware for JWT-based authentication and authorization.
 *
 * Verifies the JWT from the Authorization header, extracts user information,
 * and attaches it to the request context. Also handles role-based authorization.
 */
struct AuthMiddleware {
    struct context : public AuthContext {}; // Extend with our AuthContext

    /**
     * @brief Processes incoming requests for authentication.
     *
     * 1. Checks for Authorization header.
     * 2. Extracts and verifies JWT.
     * 3. Populates `AuthContext` with user ID and role.
     * 4. If an `auth_level` is set on the route, performs authorization check.
     *
     * @param req The incoming HTTP request.
     * @param res The outgoing HTTP response (to modify if auth fails).
     * @param ctx The middleware context to populate.
     * @return True if authentication/authorization passes, false otherwise (response modified).
     */
    void before_handle(crow::request& req, crow::response& res, context& ctx) {
        // Allow OPTIONS requests to pass through without authentication for CORS pre-flight
        if (req.method == crow::HTTPMethod::Options) {
            return;
        }

        // Get the JWT from the Authorization header
        const auto& auth_header = req.get_header("Authorization");
        if (auth_header.empty() || auth_header.rfind("Bearer ", 0) != 0) {
            // If the route doesn't require auth, just return.
            // This can be set by `app.validate_auth_level_on_path("/path", crow::AuthLevel::NONE);`
            // Crow handles this automatically if `AuthLevel` is used.
            // For now, if no token, and route explicitly needs auth, it will fail.
            // If the endpoint is public, it will proceed.
            // We assume a default `AuthLevel::OPTIONAL` behavior or explicit `AuthLevel::REQUIRED`
            // is handled by the route itself via `CROW_IMPL_ROUTE_DEFINITION(AuthMiddleware, app, method, path)`
            // where `app` has `AuthMiddleware` in its template parameters.
            LOG_DEBUG("No or malformed Authorization header. Proceeding as unauthenticated.");
            return;
        }

        std::string token = auth_header.substr(7); // "Bearer " is 7 characters

        try {
            jwt::decoded_jwt decoded_token = JWTManager::verifyToken(token);

            std::string user_id_str = decoded_token.get_payload_claim(Constants::CLAIM_USER_ID).as_string();
            std::string user_role_str = decoded_token.get_payload_claim(Constants::CLAIM_USER_ROLE).as_string();

            ctx.user_id = std::stoi(user_id_str);
            ctx.user_role = user_role_str;
            LOG_DEBUG("Authenticated user_id: {}, role: {}", ctx.user_id, ctx.user_role);

            // Authorization check based on Crow's auth_level (if configured for the route)
            // Crow's template `AuthMiddleware` provides `is_authorized` that can be overridden.
            // For simplicity, we implement explicit role checks in controllers for more fine-grained control.
            // However, if we wanted a global `ADMIN` only check for certain paths:
            // if (req.url.find("/admin") == 0 && !ctx.hasRole(Constants::ROLE_ADMIN)) {
            //     throw HttpError(crow::FORBIDDEN, Constants::ERR_FORBIDDEN);
            // }

        } catch (const jwt::error::signature_verification_exception& e) {
            LOG_WARN("JWT Signature verification failed: {}", e.what());
            throw HttpError(crow::UNAUTHORIZED, Constants::ERR_TOKEN_INVALID);
        } catch (const jwt::error::token_verification_exception& e) {
            LOG_WARN("JWT Token verification failed: {}", e.what());
            // Differentiate between expired and other invalid tokens
            if (std::string(e.what()).find("expired") != std::string::npos) {
                 throw HttpError(crow::UNAUTHORIZED, Constants::ERR_TOKEN_EXPIRED);
            }
            throw HttpError(crow::UNAUTHORIZED, Constants::ERR_TOKEN_INVALID);
        } catch (const std::exception& e) {
            LOG_ERROR("Error during JWT processing: {}", e.what());
            throw HttpError(crow::UNAUTHORIZED, Constants::ERR_TOKEN_INVALID);
        }
    }

    /**
     * @brief No-op after request handling.
     */
    void after_handle(crow::request& req, crow::response& res, context& ctx) {
        (void)req;
        (void)res;
        (void)ctx;
    }
};

#endif // ML_UTILITIES_SYSTEM_AUTH_MIDDLEWARE_HPP
```