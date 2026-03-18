#pragma once

#include "crow.h"
#include <string>
#include <jwt-cpp/jwt.h>

struct AuthMiddleware {
    struct context {}; // No shared state needed for this middleware directly

    void before_handle(crow::request& req, crow::response& res, context& ctx);
    void after_handle(crow::request& req, crow::response& res, context& ctx);

    // Static helper to get user ID from request (set by middleware)
    static std::string getUserIdFromRequest(const crow::request& req);
};
```