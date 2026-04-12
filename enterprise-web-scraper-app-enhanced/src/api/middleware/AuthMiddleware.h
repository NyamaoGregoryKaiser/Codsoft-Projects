```cpp
#ifndef AUTH_MIDDLEWARE_H
#define AUTH_MIDDLEWARE_H

#include <pistache/http.h>
#include <pistache/router.h>
#include <pistache/endpoint.h>
#include "../../auth/AuthManager.h"
#include "../../utils/Logger.h"
#include "../../utils/ErrorHandler.h"
#include "../DTOs.h"

namespace Scraper {
namespace API {
namespace Middleware {

// Custom Request object to pass user context
struct AuthRequest : public Pistache::Rest::Request {
    std::optional<Scraper::Auth::TokenPayload> user_payload;
};

// Middleware function to check JWT token
void jwt_auth_middleware(AuthRequest& request, Pistache::Http::ResponseWriter& response) {
    auto logger = Scraper::Utils::Logger::get_logger();

    auto auth_header = request.headers().tryGet<Pistache::Http::Header::Authorization>();
    if (!auth_header) {
        logger->warn("AuthMiddleware: Authorization header missing.");
        response.send(Pistache::Http::Code::Unauthorized,
                      Scraper::Utils::exceptionToJson(Scraper::Utils::UnauthorizedException("Authorization header missing."), 401).dump(),
                      Pistache::Http::Mime::MediaType("application/json"));
        throw Pistache::Http::HttpError(Pistache::Http::Code::Unauthorized, "Authorization header missing.");
    }

    std::string token_str = auth_header->value();
    if (token_str.length() < 7 || token_str.substr(0, 6) != "Bearer") {
        logger->warn("AuthMiddleware: Invalid Authorization header format.");
        response.send(Pistache::Http::Code::Unauthorized,
                      Scraper::Utils::exceptionToJson(Scraper::Utils::UnauthorizedException("Invalid Authorization header format."), 401).dump(),
                      Pistache::Http::Mime::MediaType("application/json"));
        throw Pistache::Http::HttpError(Pistache::Http::Code::Unauthorized, "Invalid Authorization header format.");
    }

    token_str = token_str.substr(7); // Remove "Bearer " prefix

    auto payload = Scraper::Auth::AuthManager::getInstance().authenticateToken(token_str);
    if (!payload) {
        logger->warn("AuthMiddleware: Invalid or expired JWT token.");
        response.send(Pistache::Http::Code::Unauthorized,
                      Scraper::Utils::exceptionToJson(Scraper::Utils::UnauthorizedException("Invalid or expired token."), 401).dump(),
                      Pistache::Http::Mime::MediaType("application/json"));
        throw Pistache::Http::HttpError(Pistache::Http::Code::Unauthorized, "Invalid or expired token.");
    }

    request.user_payload = payload; // Attach user payload to request for downstream handlers
    logger->debug("AuthMiddleware: JWT token successfully validated for user_id: {}", payload->user_id);
}

} // namespace Middleware
} // namespace API
} // namespace Scraper

#endif // AUTH_MIDDLEWARE_H
```