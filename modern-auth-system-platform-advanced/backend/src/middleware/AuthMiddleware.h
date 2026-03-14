#ifndef AUTH_SYSTEM_AUTHMIDDLEWARE_H
#define AUTH_SYSTEM_AUTHMIDDLEWARE_H

#include <pistache/router.h>
#include <pistache/endpoint.h>
#include <pistache/http.h>
#include <pistache/common.h>
#include <string>
#include <optional>
#include "../utils/JWTManager.h"
#include "../config/Config.h"
#include "../exceptions/AuthException.h"
#include "../logger/Logger.h"

namespace Middleware {

    // Context struct to pass user info to handlers
    struct RequestContext {
        int userId;
        std::string username;
        UserRole role;
    };

    // Forward declaration for user information retrieval in handlers
    inline thread_local std::optional<RequestContext> currentRequestUser = std::nullopt;

    inline void jwtAuthentication(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response, std::function<void(const Pistache::Rest::Request&, Pistache::Http::ResponseWriter)> next) {
        currentRequestUser = std::nullopt; // Reset for each request

        auto authHeader = request.headers().tryGet<Pistache::Http::Header::Authorization>();
        if (!authHeader) {
            Logger::getLogger()->debug("AuthMiddleware: No Authorization header.");
            throw AuthException(AuthErrorType::Unauthorized, "Authentication required.");
        }

        std::string tokenString = authHeader->value();
        if (tokenString.rfind("Bearer ", 0) != 0) { // Check if starts with "Bearer "
            Logger::getLogger()->debug("AuthMiddleware: Invalid Authorization header format.");
            throw AuthException(AuthErrorType::Unauthorized, "Invalid Authorization header format.");
        }

        tokenString = tokenString.substr(7); // Remove "Bearer " prefix

        auto claims = JWTManager::decodeToken(tokenString, Config::getJwtSecret());
        if (!claims.has_value() || claims->tokenType != "access") {
            Logger::getLogger()->debug("AuthMiddleware: Invalid or expired access token.");
            throw AuthException(AuthErrorType::InvalidToken, "Invalid or expired access token.");
        }

        // Store user info in thread_local context
        currentRequestUser = RequestContext{claims->userId, claims->username, claims->role};
        Logger::getLogger()->debug("AuthMiddleware: User {} (ID: {}, Role: {}) authenticated.", claims->username, claims->userId, userRoleToString(claims->role));

        next(request, response);
    }

    // Authorization middleware based on role
    inline std::function<void(const Pistache::Rest::Request&, Pistache::Http::ResponseWriter, std::function<void(const Pistache::Rest::Request&, Pistache::Http::ResponseWriter)>)>
    authorize(UserRole requiredRole) {
        return [requiredRole](const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response, std::function<void(const Pistache::Rest::Request&, Pistache::Http::ResponseWriter)> next) {
            if (!currentRequestUser.has_value()) {
                Logger::getLogger()->error("AuthorizeMiddleware: currentRequestUser is null. AuthMiddleware likely not run.");
                throw AuthException(AuthErrorType::InternalError, "Authentication context missing. Internal error.");
            }

            if (currentRequestUser->role < requiredRole) { // Assuming ADMIN > USER
                Logger::getLogger()->warn("AuthorizeMiddleware: User {} (Role: {}) attempted to access restricted resource (Required: {})",
                                          currentRequestUser->username, userRoleToString(currentRequestUser->role), userRoleToString(requiredRole));
                throw AuthException(AuthErrorType::Forbidden, "Insufficient permissions.");
            }

            Logger::getLogger()->debug("AuthorizeMiddleware: User {} (Role: {}) has required permission.", currentRequestUser->username, userRoleToString(currentRequestUser->role));
            next(request, response);
        };
    }

} // namespace Middleware

#endif // AUTH_SYSTEM_AUTHMIDDLEWARE_H