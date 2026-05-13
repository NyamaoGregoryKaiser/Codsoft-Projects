```cpp
#pragma once

#include <drogon/drogon.h>
#include <drogon/HttpFilter.h>

namespace middleware
{
    /**
     * @brief Authentication middleware for Drogon.
     * Validates JWT tokens from the 'Authorization' header.
     * If valid, sets the authenticated user's ID in the request context.
     * If invalid or missing, returns a 401 Unauthorized response.
     */
    class AuthMiddleware : public drogon::HttpFilter<AuthMiddleware>
    {
    public:
        /**
         * @brief Filter method to handle JWT authentication.
         * @param req The HTTP request.
         * @param callback The callback to send the response.
         * @param fc The filter chain to pass control to the next handler.
         */
        void doFilter(const drogon::HttpRequestPtr &req,
                      drogon::FilterCallback &&callback,
                      drogon::FilterChainCallback &&fc) override;

        /**
         * @brief Helper to extract bearer token.
         * @param headerValue The full Authorization header value.
         * @return The token string, or empty if not found/invalid format.
         */
        static std::string extractToken(const std::string& headerValue);
    };

} // namespace middleware
```