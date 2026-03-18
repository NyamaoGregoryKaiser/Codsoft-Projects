#include "AuthMiddleware.h"
#include "config/AppConfig.h"
#include "spdlog/spdlog.h"
#include "common/JsonUtils.h" // For error responses

void AuthMiddleware::before_handle(crow::request& req, crow::response& res, context& ctx) {
    // Exclude public routes from authentication
    if (req.url == "/api/v1/auth/register" || req.url == "/api/v1/auth/login" || req.url == "/") {
        return;
    }

    std::string auth_header = req.get_header("Authorization");
    if (auth_header.empty() || auth_header.rfind("Bearer ", 0) != 0) {
        JsonUtils::sendErrorResponse(res, crow::HTTPResponseCode::Unauthorized, "Authorization header missing or malformed.");
        res.end(); // Stop further processing
        return;
    }

    std::string token_str = auth_header.substr(7); // "Bearer " is 7 characters

    try {
        auto verifier = jwt::verify()
            .allow_algorithm(jwt::algorithm::hs256{AppConfig::getInstance().getJwtSecret()});

        auto decoded_token = jwt::decode(token_str);
        verifier.verify(decoded_token);

        auto user_id_claim = decoded_token.get_payload_claim("user_id");
        if (user_id_claim.is_empty()) {
            throw std::runtime_error("JWT does not contain user_id claim.");
        }
        std::string user_id = user_id_claim.as_string();

        // Store user_id in request context for controllers to access
        req.add_context<AuthMiddleware::context>(user_id);
        spdlog::debug("Authenticated user_id: {}", user_id);

    } catch (const jwt::error::signature_verification_error& e) {
        spdlog::warn("JWT signature verification failed: {}", e.what());
        JsonUtils::sendErrorResponse(res, crow::HTTPResponseCode::Unauthorized, "Invalid token signature.");
        res.end();
        return;
    } catch (const jwt::error::token_verification_error& e) {
        spdlog::warn("JWT token verification failed: {}", e.what());
        JsonUtils::sendErrorResponse(res, crow::HTTPResponseCode::Unauthorized, "Token expired or invalid.");
        res.end();
        return;
    } catch (const std::exception& e) {
        spdlog::error("JWT parsing or unexpected error: {}", e.what());
        JsonUtils::sendErrorResponse(res, crow::HTTPResponseCode::Unauthorized, "Invalid token.");
        res.end();
        return;
    }
}

void AuthMiddleware::after_handle(crow::request& req, crow::response& res, context& ctx) {
    // No specific action needed after handle for auth middleware
}

std::string AuthMiddleware::getUserIdFromRequest(const crow::request& req) {
    auto& ctx = req.get_context<AuthMiddleware::context>();
    if (ctx.has_value()) {
        return ctx.value<std::string>(); // Assuming the context stores the user_id directly
    }
    return ""; // Or throw an error if user_id is expected to always be present
}
```