#include "AuthMiddleware.h"
#include "utils/JwtManager.h"
#include "utils/ApiResponse.h"
#include "models/User.h" // For storing user info in request attributes

void AuthMiddleware::doFilter(const drogon::HttpRequestPtr &req,
                              drogon::FilterCallback &&fcb,
                              drogon::FilterChainCallback &&fcc) {
    LOG_DEBUG << "AuthMiddleware: Processing request for path " << req->getPath();

    const std::string& authHeader = req->getHeader("Authorization");

    if (authHeader.empty()) {
        LOG_WARN << "AuthMiddleware: Missing Authorization header.";
        return fcb(ApiResponse::unauthorized("Authorization token required."));
    }

    if (authHeader.rfind("Bearer ", 0) != 0) {
        LOG_WARN << "AuthMiddleware: Invalid Authorization header format.";
        return fcb(ApiResponse::unauthorized("Invalid token format. Must be 'Bearer [token]'."));
    }

    std::string token = authHeader.substr(7); // Extract token after "Bearer "

    Json::Value payload;
    std::string error;
    if (!JwtManager::verifyToken(token, payload, error)) {
        LOG_WARN << "AuthMiddleware: Token verification failed: " << error;
        return fcb(ApiResponse::unauthorized("Invalid or expired token."));
    }

    // Extract user info from payload
    User userInfo;
    userInfo.id = payload["user_id"].asString();
    userInfo.username = payload["username"].asString();
    userInfo.role = payload["role"].asString();

    if (userInfo.id.empty() || userInfo.username.empty() || userInfo.role.empty()) {
        LOG_ERROR << "AuthMiddleware: JWT payload missing required user information.";
        return fcb(ApiResponse::unauthorized("Token payload incomplete."));
    }

    // Store user info in request attributes for later use by controllers
    req->getAttributes()->insert("user_info", userInfo);
    LOG_DEBUG << "AuthMiddleware: User " << userInfo.username << " (" << userInfo.role << ") authenticated.";

    // Continue to next filter/handler
    fcc();
}