```cpp
#include "AuthMiddleware.h"
#include "core/utils/Logger.h"
#include "core/utils/JWTManager.h"
#include <nlohmann/json.hpp>
#include <string>

using namespace Pistache;
using namespace nlohmann;

void AuthMiddleware::authenticate(const Rest::Request& request, Http::ResponseWriter response) {
    const auto& auth_header = request.headers().tryGet<Http::Header::Authorization>();

    if (!auth_header) {
        Logger::warn("Authentication failed: Missing Authorization header.");
        response.send(Http::Code::Unauthorized, json({{"message", "Missing Authorization header"}}).dump());
        return;
    }

    std::string token_str = auth_header->value();
    if (token_str.rfind("Bearer ", 0) == 0) { // Check if it starts with "Bearer "
        token_str = token_str.substr(7); // Remove "Bearer " prefix
    } else {
        Logger::warn("Authentication failed: Invalid Authorization header format (missing Bearer prefix).");
        response.send(Http::Code::Unauthorized, json({{"message", "Invalid Authorization header format"}}).dump());
        return;
    }

    std::optional<json> claims = JWTManager::verifyToken(token_str);

    if (claims) {
        // Token is valid, extract user ID and attach to request for controllers
        try {
            long long user_id = std::stoll(claims->at("user_id").get<std::string>());
            request.addAttribute("user_id", user_id);
            // Logger::debug("User {} authenticated successfully.", claims->at("username").get<std::string>());
        } catch (const std::exception& e) {
            Logger::error("Failed to parse user_id from JWT claims: {}", e.what());
            response.send(Http::Code::Internal_Server_Error, json({{"message", "Failed to process authentication token"}}).dump());
            return;
        }
    } else {
        Logger::warn("Authentication failed: Invalid or expired token.");
        response.send(Http::Code::Unauthorized, json({{"message", "Invalid or expired token"}}).dump());
        return;
    }
}
```