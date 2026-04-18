```cpp
#ifndef PERFOMETRICS_AUTHMIDDLEWARE_H
#define PERFOMETRICS_AUTHMIDDLEWARE_H

#include "crow.h"
#include "../services/AuthService.h"
#include "../models/User.h"
#include "../utils/Logger.h"
#include <string>
#include <optional>

namespace PerfoMetrics {

struct AuthMiddleware {
    struct context {
        std::optional<User> authenticated_user;
    };

    AuthService auth_service;

    template <typename Next>
    void call(crow::request& req, crow::response& res, Next&& next) {
        std::string auth_header = req.get_header("Authorization");
        if (auth_header.empty() || auth_header.rfind("Bearer ", 0) != 0) {
            Logger::get_logger()->warn("Authorization header missing or invalid format for {}", req.url);
            res.code = 401; // Unauthorized
            res.write({"error", "Authorization token required"}.dump());
            res.end();
            return;
        }

        std::string token = auth_header.substr(7); // "Bearer ".length()
        try {
            auto user_opt = auth_service.validate_token(token);
            if (!user_opt) {
                Logger::get_logger()->warn("Invalid or expired token for {}", req.url);
                res.code = 401; // Unauthorized
                res.write({"error", "Invalid or expired token"}.dump());
                res.end();
                return;
            }
            req.set_context<AuthMiddleware>(user_opt.value());
            next(req, res);
        } catch (const AppException& e) {
            Logger::get_logger()->warn("Auth error for {}: {}", req.url, e.what());
            res.code = e.get_http_status();
            res.write(nlohmann::json({{"error", e.what()}}).dump());
            res.end();
        } catch (const std::exception& e) {
            Logger::get_logger()->error("Unexpected error during token validation for {}: {}", req.url, e.what());
            res.code = 500;
            res.write({"error", "Internal server error during authentication"}.dump());
            res.end();
        }
    }
};

} // namespace PerfoMetrics

#endif //PERFOMETRICS_AUTHMIDDLEWARE_H
```