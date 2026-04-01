```cpp
#include "AuthMiddleware.h"
#include "utils/Logger.h"
#include "utils/AppConfig.h"
#include "utils/JsonUtils.h"
#include "common/Constants.h"

#include <iostream>

Pistache::Rest::RouteCallback AuthMiddleware::wrapHandler(Pistache::Rest::RouteCallback handler) {
    return [this, handler](const Pistache::Http::Request& request, Pistache::Http::ResponseWriter response) {
        try {
            std::string auth_header = request.headers().tryGet(Pistache::Http::Header::Authorization)->raw();
            if (auth_header.empty() || auth_header.rfind("Bearer ", 0) != 0) {
                LOG_WARN("Auth: Missing or invalid Authorization header.");
                JsonUtils::sendError(response, Pistache::Http::Code::Unauthorized, "Missing or invalid Authorization header.");
                return Pistache::Rest::Router::Result::Stop;
            }

            std::string token = auth_header.substr(7); // "Bearer ".length()
            long long userId;
            if (!verifyToken(token, userId)) {
                LOG_WARN("Auth: Invalid or expired JWT token.");
                JsonUtils::sendError(response, Pistache::Http::Code::Unauthorized, "Invalid or expired token.");
                return Pistache::Rest::Router::Result::Stop;
            }

            // Store user ID in request context for later use by handlers
            // Pistache does not have a direct request context. A common way is to modify the request object
            // or pass it explicitly. For simplicity, we'll log, but in a real app, extend Http::Request.
            // Example of how you might pass context (simplified):
            // request.addUserData("userId", std::to_string(userId)); // Hypothetical method
            LOG_DEBUG("Auth: User {} authenticated.", userId);
            
            // Proceed to the actual handler
            return handler(request, response);

        } catch (const std::runtime_error& e) {
            LOG_ERROR("Auth: Token verification runtime error: {}", e.what());
            JsonUtils::sendError(response, Pistache::Http::Code::Unauthorized, "Authentication failed.");
            return Pistache::Rest::Router::Result::Stop;
        } catch (const std::exception& e) {
            LOG_ERROR("Auth: Unexpected error during token verification: {}", e.what());
            JsonUtils::sendError(response, Pistache::Http::Code::Internal_Server_Error, "Authentication error.");
            return Pistache::Rest::Router::Result::Stop;
        }
    };
}

bool AuthMiddleware::verifyToken(const std::string& token, long long& userId) {
    try {
        auto verifier = jwt::verify()
            .allow_algorithm(jwt::algorithm::hs256{AppConfig::get("JWT_SECRET")})
            .with_issuer(Constants::JWT_ISSUER);

        auto decoded_token = jwt::decode(token);
        verifier.verify(decoded_token);

        // Check expiration
        auto expires_at = decoded_token.get_expires_at();
        if (expires_at <= std::chrono::system_clock::now()) {
            LOG_WARN("JWT token expired.");
            return false;
        }

        // Extract user ID
        if (decoded_token.has_claim("userId")) {
            userId = decoded_token.get_claim<long long>("userId").as_int();
            return true;
        }
        LOG_WARN("JWT token missing 'userId' claim.");
        return false;

    } catch (const jwt::verification_error& e) {
        LOG_WARN("JWT verification failed: {}", e.what());
        return false;
    } catch (const jwt::error::signature_verification_exception& e) {
        LOG_WARN("JWT signature verification failed: {}", e.what());
        return false;
    } catch (const std::exception& e) {
        LOG_ERROR("Error verifying JWT token: {}", e.what());
        return false;
    }
}
```