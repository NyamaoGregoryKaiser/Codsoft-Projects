```cpp
#ifndef ZENITH_AUTH_MIDDLEWARE_HPP
#define ZENITH_AUTH_MIDDLEWARE_HPP

#include <httplib.h>
#include <string>
#include <functional>
#include "../utils/jwt_manager.hpp"
#include "../utils/logger.hpp"

namespace Zenith {
namespace Api {

// Middleware to authenticate requests using JWT
// Adds 'userId', 'username', 'userRole' to request attributes if authenticated
inline httplib::Server::Handler authMiddleware(const httplib::Server::Handler& handler) {
    return [handler](const httplib::Request& req, httplib::Response& res) {
        std::string auth_header = req.get_header_value("Authorization");
        if (auth_header.empty() || !auth_header.starts_with("Bearer ")) {
            res.status = 401; // Unauthorized
            res.set_content("{\"message\": \"Authorization token missing or invalid format\"}", "application/json");
            LOG_WARN("Auth: Missing or malformed Authorization header from {0}", req.remote_addr);
            return;
        }

        std::string token = auth_header.substr(7); // "Bearer ".length()
        auto payload_opt = Utils::JwtManager::getInstance().verifyToken(token);

        if (!payload_opt.has_value()) {
            res.status = 401; // Unauthorized
            res.set_content("{\"message\": \"Invalid or expired token\"}", "application/json");
            LOG_WARN("Auth: Invalid or expired token from {0}", req.remote_addr);
            return;
        }

        // Attach user info to request context
        req.set_attr("userId", payload_opt->user_id);
        req.set_attr("username", payload_opt->username);
        req.set_attr("userEmail", payload_opt->email);
        req.set_attr("userRole", payload_opt->role);

        // Continue to the next handler
        handler(req, res);
    };
}

// Middleware to authorize requests based on roles
// Assumes authMiddleware has already run and attached userRole to req attributes
inline httplib::Server::Handler roleMiddleware(const httplib::Server::Handler& handler, const std::string& requiredRole) {
    return [handler, requiredRole](const httplib::Request& req, httplib::Response& res) {
        auto userRole_ptr = req.get_attr<std::string>("userRole");
        if (!userRole_ptr || userRole_ptr->empty()) {
            // This should ideally not happen if authMiddleware runs first
            res.status = 403; // Forbidden (or 401 if auth failed silently)
            res.set_content("{\"message\": \"Authentication context missing for role check.\"}", "application/json");
            LOG_ERROR("RoleMiddleware: Missing userRole for {0}", req.path);
            return;
        }

        if (*userRole_ptr != requiredRole && *userRole_ptr != "admin") { // Admins can do anything
            res.status = 403; // Forbidden
            res.set_content("{\"message\": \"Access denied: insufficient privileges\"}", "application/json");
            LOG_WARN("Auth: User '{0}' attempted to access '{1}' with role '{2}', but '{3}' or 'admin' is required.",
                     *req.get_attr<std::string>("username"), req.path, *userRole_ptr, requiredRole);
            return;
        }

        handler(req, res);
    };
}

} // namespace Api
} // namespace Zenith

#endif // ZENITH_AUTH_MIDDLEWARE_HPP
```