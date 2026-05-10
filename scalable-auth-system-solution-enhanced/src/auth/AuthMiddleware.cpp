```cpp
#include "AuthMiddleware.h"
#include <regex> // For regex_search

// Global pointer to AuthService
// This is a common pattern for Crow middlewares to access services.
// An alternative is to pass it during app initialization if the middleware
// can be constructed directly. For simplicity, we use a global setter.
static AuthService* global_auth_service = nullptr;

// Default constructor, usually not used directly if AuthService is needed
AuthMiddleware::AuthMiddleware() = default;

// Constructor to set the AuthService
AuthMiddleware::AuthMiddleware(AuthService* service) {
    global_auth_service = service;
    LOG_INFO("AuthMiddleware initialized with AuthService.");
}

void AuthMiddleware::before_handle(crow::request& req, crow::response& res, context& ctx) {
    if (!global_auth_service) {
        LOG_FATAL("AuthMiddleware: AuthService not initialized!");
        JsonUtils::sendError(res, "server_error", "Authentication service not available.", 500);
        res.end(); // Terminate request
        return;
    }

    // Skip authentication for public routes
    std::string path = req.url;
    if (path == "/register" || path == "/login" || path == "/refresh-token" || path == "/health") {
        return;
    }
    
    // For OPTIONS requests, allow them to pass through, handled in main.cpp
    if (req.method == crow::HTTPMethod::Options) {
        return;
    }

    std::string auth_header = req.get_header("Authorization");
    if (auth_header.empty()) {
        JsonUtils::sendError(res, "unauthorized", "Authorization header missing.", 401);
        res.end();
        return;
    }

    // Extract token (Bearer <token>)
    std::smatch match;
    std::regex bearer_regex(R"(Bearer\s(.+))");
    if (!std::regex_search(auth_header, match, bearer_regex) || match.size() < 2) {
        JsonUtils::sendError(res, "unauthorized", "Invalid Authorization header format. Expected 'Bearer <token>'.", 401);
        res.end();
        return;
    }
    std::string token = match[1].str();

    auto decoded_jwt_opt = global_auth_service->verifyAccessToken(token);

    if (decoded_jwt_opt) {
        auto decoded_jwt = decoded_jwt_opt.value();
        std::string user_id = decoded_jwt.get_subject();
        std::string email = decoded_jwt.get_payload_claim("email").as_string();

        ctx.authenticated_user = AuthContext{user_id, email};
        LOG_DEBUG("User authenticated: %s (ID: %s)", email.c_str(), user_id.c_str());
    } else {
        JsonUtils::sendError(res, "unauthorized", "Invalid or expired access token.", 401);
        res.end();
    }
}

void AuthMiddleware::after_handle(crow::request& req, crow::response& res, context& ctx) {
    // Post-processing if needed, e.g., logging response times
    if (ctx.authenticated_user) {
        LOG_DEBUG("Request for authenticated user %s completed with status %d.", 
                  ctx.authenticated_user->email.c_str(), res.code);
    }
}
```