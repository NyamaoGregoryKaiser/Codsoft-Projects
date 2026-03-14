#pragma once

#include <drogon/HttpFilter.h>
#include <json/json.h>

// Note: Drogon has a global exception handler `app().setExceptionHandler`.
// This file serves as an example of a filter-based error handler,
// though `setExceptionHandler` is often more suitable for global catch-alls.
// For specific routes, a filter can be useful.

class ErrorHandlingMiddleware : public drogon::HttpFilter<ErrorHandlingMiddleware> {
public:
    ErrorHandlingMiddleware() = default;

    void doFilter(const drogon::HttpRequestPtr &req,
                  drogon::FilterCallback &&fcb,
                  drogon::FilterChainCallback &&fcc);
};