#pragma once

#include <crow.h>
#include "../utils/jwt_manager.h"
#include "../utils/custom_exceptions.h"
#include "../utils/logger.h"

namespace Middleware {

struct Auth {
    struct context {
        std::string user_id;
        std::string user_role;
    };

    Security::JwtManager jwt_manager;

    void before_handle(crow::request& req, crow::response& res, context& ctx) {
        const std::string auth_header = req.get_header("Authorization");

        if (auth_header.empty() || auth_header.length() < 7 || auth_header.substr(0, 7) != "Bearer ") {
            LOG_DEBUG("Missing or malformed Authorization header.");
            throw CustomExceptions::UnauthorizedException("Bearer token required.");
        }

        std::string token = auth_header.substr(7); // "Bearer " is 7 chars
        
        try {
            Security::TokenClaims claims = jwt_manager.verifyToken(token);
            if (claims.type != "access") {
                LOG_WARN("Attempted to use refresh token as access token for user ID: {}", claims.userId);
                throw CustomExceptions::UnauthorizedException("Invalid token type. Access token expected.");
            }
            ctx.user_id = claims.userId;
            ctx.user_role = claims.role;
            LOG_DEBUG("User authenticated: ID={}, Role={}", ctx.user_id, ctx.user_role);
        } catch (const std::exception& e) {
            LOG_WARN("JWT verification failed for request: {}", e.what());
            throw CustomExceptions::UnauthorizedException("Invalid or expired token. " + std::string(e.what()));
        }
    }

    void after_handle(crow::request& req, crow::response& res, context& ctx) {
        // No post-processing needed
    }
};

} // namespace Middleware