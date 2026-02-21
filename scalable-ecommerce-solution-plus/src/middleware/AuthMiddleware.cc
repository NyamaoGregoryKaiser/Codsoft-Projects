```cpp
#include "AuthMiddleware.h"
#include <spdlog/spdlog.h>

namespace ECommerce {
    namespace Middleware {

        AuthMiddleware::AuthMiddleware() {
            // Get JWT secret from app config
            std::string jwtSecret = app().get<std::string>("jwt_secret", "supersecretjwtkey");
            _jwtManager = std::make_shared<Utils::JwtManager>(jwtSecret);
        }

        void AuthMiddleware::doFilter(const HttpRequestPtr& req,
                                       FilterCallback&& fcbl,
                                       FilterChainCallback&& fccbl) {
            // Check for Authorization header
            const std::string& authHeader = req->getHeader("Authorization");

            if (authHeader.empty() || authHeader.length() <= 7 || authHeader.substr(0, 7) != "Bearer ") {
                spdlog::warn("AuthMiddleware: Missing or malformed Authorization header for path: {}", req->getPath());
                Json::Value json;
                json["error"] = "Authentication required";
                json["statusCode"] = 401;
                auto resp = HttpResponse::newHttpJsonResponse(json);
                resp->setStatusCode(k401Unauthorized);
                fcbl(resp); // Block request
                return;
            }

            std::string token = authHeader.substr(7); // "Bearer " is 7 chars
            std::optional<Utils::JwtPayload> payload = _jwtManager->verifyToken(token);

            if (!payload) {
                spdlog::warn("AuthMiddleware: Invalid or expired token for path: {}", req->getPath());
                Json::Value json;
                json["error"] = "Invalid or expired token";
                json["statusCode"] = 401;
                auto resp = HttpResponse::newHttpJsonResponse(json);
                resp->setStatusCode(k401Unauthorized);
                fcbl(resp); // Block request
                return;
            }

            // Store user info in request context for controller access
            req->addCustomVariant("userId", payload->userId);
            req->addCustomVariant("username", payload->username);
            req->addCustomVariant("role", payload->role);
            req->addCustomVariant("email", payload->email);

            spdlog::debug("AuthMiddleware: Authenticated user ID {} for path: {}", payload->userId, req->getPath());
            fccbl(); // Continue to the next filter or controller
        }
    }
}
```