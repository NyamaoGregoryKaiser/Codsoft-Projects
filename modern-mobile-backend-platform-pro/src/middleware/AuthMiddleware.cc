```cpp
#include "AuthMiddleware.h"
#include "src/utils/JWTUtils.h"
#include "src/utils/Logger.h"
#include "src/exceptions/ApiException.h"
#include <string_view>

namespace middleware
{
    void AuthMiddleware::doFilter(const drogon::HttpRequestPtr &req,
                                   drogon::FilterCallback &&callback,
                                   drogon::FilterChainCallback &&fc)
    {
        const std::string &authHeader = req->getHeader("Authorization");
        if (authHeader.empty())
        {
            LOG_WARN("AuthMiddleware: Missing Authorization header for request {}", req->getPath());
            throw api::UnauthorizedException("Missing Authorization header.", "MISSING_AUTH_HEADER");
        }

        std::string token = extractToken(authHeader);
        if (token.empty())
        {
            LOG_WARN("AuthMiddleware: Invalid Authorization header format for request {}", req->getPath());
            throw api::BadRequestException("Invalid Authorization header format. Expected 'Bearer <token>'.", "INVALID_AUTH_HEADER_FORMAT");
        }

        std::string userId = utils::JWTUtils::getUserIdFromToken(token);
        if (userId.empty())
        {
            LOG_WARN("AuthMiddleware: Invalid or expired JWT token for request {}", req->getPath());
            throw api::UnauthorizedException("Invalid or expired JWT token.", "INVALID_TOKEN");
        }

        // Store user ID in request context for later use by controllers/services
        req->attributes()->insert("userId", userId);
        LOG_DEBUG("AuthMiddleware: Request by user ID '{}' for path {}", userId, req->getPath());
        fc(); // Proceed to the next filter or controller
    }

    std::string AuthMiddleware::extractToken(const std::string& headerValue)
    {
        std::string_view sv(headerValue);
        if (sv.length() > 7 && sv.substr(0, 7) == "Bearer ")
        {
            return std::string(sv.substr(7));
        }
        return "";
    }

} // namespace middleware
```