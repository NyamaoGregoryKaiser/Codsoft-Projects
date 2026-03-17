#include "AuthMiddleware.h"
#include "utils/Logger.h"
#include "common/Constants.h"
#include <drogon/HttpAppFramework.h>

namespace cms {

void AuthMiddleware::doFilter(const drogon::HttpRequestPtr& req,
                              drogon::FilterCallback&& fcbl,
                              drogon::FilterChainCallback&& fncbl) {
    // 1. Check for Authorization header
    const std::string& authHeader = req->getHeader("Authorization");
    if (authHeader.empty() || authHeader.rfind("Bearer ", 0) != 0) {
        LOG_DEBUG("Missing or malformed Authorization header.");
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k401Unauthorized);
        resp->setBody(ERR_UNAUTHORIZED);
        fcbl(resp); // Stop processing and return unauthorized
        return;
    }

    std::string token = authHeader.substr(7); // "Bearer " is 7 chars
    if (token.empty()) {
        LOG_DEBUG("Authorization token is empty.");
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k401Unauthorized);
        resp->setBody(ERR_UNAUTHORIZED);
        fcbl(resp);
        return;
    }

    // 2. Verify JWT token
    try {
        TokenPayload payload = TokenService::instance().verifyToken(token);
        
        // Ensure it's an access token
        if (payload.tokenType != "access") {
            LOG_WARN("Attempted to use a refresh token as an access token for route: {}", req->getPath());
            auto resp = drogon::HttpResponse::newHttpResponse();
            resp->setStatusCode(drogon::k401Unauthorized);
            resp->setBody("Unauthorized: Access token required.");
            fcbl(resp);
            return;
        }

        // Store user ID and role in request attributes for later use in controllers
        req->attributes()->insert("user_id", payload.userId);
        req->attributes()->insert("user_role", payload.role);

        LOG_DEBUG("Token verified for User ID: {}, Role: {}", payload.userId, userRoleToString(payload.role));
        fncbl(); // Continue to the next filter or controller
    } catch (const jwt::error::token_verification_exception& e) {
        LOG_WARN("Token verification failed for route {}: {}", req->getPath(), e.what());
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k401Unauthorized);
        resp->setBody(ERR_INVALID_TOKEN);
        fcbl(resp);
    } catch (const std::exception& e) {
        LOG_ERROR("AuthMiddleware internal error for route {}: {}", req->getPath(), e.what());
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k500InternalServerError);
        resp->setBody(ERR_SERVER_ERROR);
        fcbl(resp);
    }
}


void AdminMiddleware::doFilter(const drogon::HttpRequestPtr& req,
                              drogon::FilterCallback&& fcbl,
                              drogon::FilterChainCallback&& fncbl) {
    // This middleware assumes AuthMiddleware has already run and populated user_role attribute
    if (!req->attributes()->find("user_role")) {
        // This should not happen if AuthMiddleware is correctly chained before AdminMiddleware
        LOG_ERROR("AdminMiddleware called without user_role attribute. AuthMiddleware missing?");
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k500InternalServerError);
        resp->setBody(ERR_SERVER_ERROR);
        fcbl(resp);
        return;
    }

    UserRole userRole = req->attributes()->get<UserRole>("user_role");
    if (userRole != UserRole::ADMIN) {
        LOG_WARN("User ID {} attempted to access admin resource without ADMIN role. Current role: {}",
                 req->attributes()->get<std::string>("user_id"), userRoleToString(userRole));
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k403Forbidden);
        resp->setBody(ERR_FORBIDDEN);
        fcbl(resp);
        return;
    }

    fncbl(); // User is an ADMIN, continue processing
}

} // namespace cms
```