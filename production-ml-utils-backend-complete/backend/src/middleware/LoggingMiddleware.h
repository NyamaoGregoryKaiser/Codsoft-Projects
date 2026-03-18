#pragma once

#include "crow.h"

struct LoggingMiddleware {
    struct context {}; // No specific context data for this middleware

    void before_handle(crow::request& req, crow::response& res, context& ctx);
    void after_handle(crow::request& req, crow::response& res, context& ctx);
};
```