#pragma once

#include <drogon/HttpFilter.h>
#include "services/TokenService.h"
#include "common/Enums.h"

namespace cms {

class AuthMiddleware : public drogon::HttpFilter<AuthMiddleware> {
public:
    // This method is called to filter requests
    void doFilter(const drogon::HttpRequestPtr& req,
                  drogon::FilterCallback&& fcbl,
                  drogon::FilterChainCallback&& fncbl);

    // Filter configuration (optional)
    std::string filterName() const override { return "AuthMiddleware"; }
    // You can define required roles here if it's a general auth filter
    // For role-based access, we'll use a separate AdminMiddleware/EditorMiddleware or check roles in controllers.
};

class AdminMiddleware : public drogon::HttpFilter<AdminMiddleware> {
public:
    void doFilter(const drogon::HttpRequestPtr& req,
                  drogon::FilterCallback&& fcbl,
                  drogon::FilterChainCallback&& fncbl);
    std::string filterName() const override { return "AdminMiddleware"; }
};

} // namespace cms
```