```cpp
#pragma once

#include <drogon/HttpFilter.h>
#include <json/json.h>
#include "../utils/JwtManager.h"
#include "../utils/Logger.h"
#include <vector>
#include <string>

/**
 * @brief HTTP Filter for JWT authentication and authorization.
 *
 * This filter intercepts requests to protected routes, extracts and verifies
 * the JWT token, and optionally performs role-based authorization checks.
 * If successful, it injects user information into the request context.
 */
class AuthFilter : public drogon::HttpFilter<AuthFilter> {
public:
    AuthFilter() = default;

    /**
     * @brief Filters incoming HTTP requests.
     *
     * Extracts JWT from Authorization header, verifies it, and attaches user claims
     * to the request context. Optionally checks if the user has required roles.
     *
     * @param req The HTTP request.
     * @param callback The callback function to send response.
     * @param fc The filter chain callback to continue processing.
     * @param requiredRoles A vector of roles that the authenticated user must have.
     */
    void doFilter(const drogon::HttpRequestPtr& req,
                  drogon::FilterCallback&& callback,
                  drogon::FilterChainCallback&& fc,
                  const std::vector<std::string>& requiredRoles = {});
};
```