```cpp
#include "AuthFilter.h"
#include "../utils/Common.h"

void AuthFilter::doFilter(const drogon::HttpRequestPtr& req,
                          drogon::FilterCallback&& callback,
                          drogon::FilterChainCallback&& fc,
                          const std::vector<std::string>& requiredRoles) {
    LOG_DEBUG("AuthFilter triggered for path: {}", req->getPath());

    const std::string& authHeader = req->getHeader("Authorization");

    if (authHeader.empty() || authHeader.length() < 7 || authHeader.substr(0, 6) != "Bearer") {
        LOG_WARN("AuthFilter: Missing or malformed Authorization header.");
        Json::Value err;
        err["code"] = 401;
        err["message"] = "Unauthorized: Missing or invalid token format.";
        auto resp = drogon::HttpResponse::newHttpJsonResponse(err);
        resp->setStatusCode(drogon::k401Unauthorized);
        callback(resp);
        return;
    }

    std::string token = authHeader.substr(7); // Extract token after "Bearer "

    Json::Value claims = JwtManager::verifyToken(token);

    if (claims.empty()) {
        LOG_WARN("AuthFilter: JWT verification failed for token.");
        Json::Value err;
        err["code"] = 401;
        err["message"] = "Unauthorized: Invalid or expired token.";
        auto resp = drogon::HttpResponse::newHttpJsonResponse(err);
        resp->setStatusCode(drogon::k401Unauthorized);
        callback(resp);
        return;
    }

    // Store claims in request attributes for controllers to use
    req->attributes()->insert("user_id", claims["user_id"].asString());
    req->attributes()->insert("username", claims["username"].asString());
    req->attributes()->insert("user_roles", claims["roles"]); // Json::Value array

    LOG_DEBUG("AuthFilter: Token valid for user_id: {}", claims["user_id"].asString());

    // Role-based authorization check
    if (!requiredRoles.empty()) {
        Json::Value userRoles = claims["roles"];
        bool authorized = false;
        for (const auto& requiredRole : requiredRoles) {
            for (const auto& userRole : userRoles) {
                if (userRole.asString() == requiredRole) {
                    authorized = true;
                    break;
                }
            }
            if (authorized) break;
        }

        if (!authorized) {
            LOG_WARN("AuthFilter: User {} lacks required roles for path: {}", claims["user_id"].asString(), req->getPath());
            Json::Value err;
            err["code"] = 403;
            err["message"] = "Forbidden: Insufficient permissions.";
            auto resp = drogon::HttpResponse::newHttpJsonResponse(err);
            resp->setStatusCode(drogon::k403Forbidden);
            callback(resp);
            return;
        }
    }

    // Continue to next filter or controller
    fc();
}
```