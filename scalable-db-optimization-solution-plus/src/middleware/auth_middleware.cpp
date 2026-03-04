```cpp
#include "auth_middleware.h"

namespace middleware {

AuthMiddleware::AuthMiddleware(std::shared_ptr<JWTManager> jwt_manager)
    : jwt_manager_(jwt_manager) {}

void AuthMiddleware::before_handle(crow::request& req, crow::response& res, crow::context& ctx) {
    // Skip authentication for public routes (e.g., /auth/login, /auth/register)
    if (req.url.find("/auth") == 0) {
        return;
    }

    std::string auth_header = req.get_header("Authorization");
    if (auth_header.empty() || auth_header.length() < 7 || auth_header.substr(0, 6) != "Bearer") {
        res.code = crow::UNAUTHORIZED;
        res.write(crow::json::wvalue({{"error", "Unauthorized: Missing or invalid Authorization header."}}).dump());
        res.end();
        LOG_WARN("Unauthorized access attempt: Missing or invalid Authorization header for {}", req.url);
        return;
    }

    std::string token = auth_header.substr(7); // "Bearer " + token
    try {
        long user_id = jwt_manager_->validate_token(token);
        // Store user_id in context for downstream handlers
        ctx.set<long>(AUTHORIZED_USER_ID_KEY, user_id);
        LOG_DEBUG("User ID {} authenticated for {}", user_id, req.url);
    } catch (const UnauthorizedException& e) {
        res.code = crow::UNAUTHORIZED;
        res.write(crow::json::wvalue({{"error", e.what()}}).dump());
        res.end();
        LOG_WARN("Unauthorized access attempt: Invalid token for {}. Error: {}", req.url, e.what());
    } catch (const std::exception& e) {
        res.code = crow::INTERNAL_SERVER_ERROR;
        res.write(crow::json::wvalue({{"error", "Authentication error."}}).dump());
        res.end();
        LOG_ERROR("Internal error during authentication for {}: {}", req.url, e.what());
    }
}

void AuthMiddleware::after_handle(crow::request& /*req*/, crow::response& /*res*/, crow::context& /*ctx*/) {
    // No specific action after handle for now
}

} // namespace middleware
```