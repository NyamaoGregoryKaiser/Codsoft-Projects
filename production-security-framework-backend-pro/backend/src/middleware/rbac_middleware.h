#pragma once

#include <crow.h>
#include <string>
#include <vector>
#include <algorithm> // For std::find
#include "../utils/custom_exceptions.h"
#include "../utils/logger.h"
#include "auth_middleware.h" // To access Auth context

namespace Middleware {

class RBAC {
public:
    RBAC(std::vector<std::string> allowed_roles) : allowed_roles_(std::move(allowed_roles)) {}

    template <typename AllRoutesContext>
    void before_handle(crow::request& req, crow::response& res, AllRoutesContext& ctx) {
        // This middleware assumes Auth middleware has already run and populated the context
        // This is possible because crow's middleware chain passes the *same* context to all middlewares
        // as long as their context types are compatible or they access a common parent context.
        // For simplicity, we assume `Auth::context` is directly available or we cast `AllRoutesContext`
        // if it's a combined context. For Crow, the context is usually combined automatically.
        
        // Check if the Auth context exists and has user_id/user_role
        // CROW has a single context type for all middlewares applied to an endpoint
        // So `AllRoutesContext` will contain all middleware contexts.
        // We need to access Auth's specific context.
        try {
            const std::string& user_role = ctx.template get<Auth>().user_role;

            auto it = std::find(allowed_roles_.begin(), allowed_roles_.end(), user_role);
            if (it == allowed_roles_.end()) {
                LOG_WARN("User with role '{}' attempted to access forbidden resource. Required roles: {}", user_role, fmt::join(allowed_roles_, ", "));
                throw CustomExceptions::ForbiddenException("Insufficient permissions to access this resource.");
            }
            LOG_DEBUG("User with role '{}' is authorized.", user_role);
        } catch (const crow::bad_context_access& e) {
            LOG_CRITICAL("RBAC Middleware: Auth context not found. Is Auth middleware correctly applied before RBAC? Error: {}", e.what());
            throw CustomExceptions::InternalServerErrorException("Authorization system misconfigured.");
        }
    }

    template <typename AllRoutesContext>
    void after_handle(crow::request& req, crow::response& res, AllRoutesContext& ctx) {
        // No post-processing needed
    }

private:
    std::vector<std::string> allowed_roles_;
};

} // namespace Middleware