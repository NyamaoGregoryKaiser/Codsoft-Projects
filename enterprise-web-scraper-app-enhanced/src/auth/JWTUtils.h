```cpp
#ifndef JWT_UTILS_H
#define JWT_UTILS_H

#include <string>
#include <chrono>
#include <jwt-cpp/jwt.h>
#include <nlohmann/json.hpp>
#include "../utils/Logger.h"
#include "../config/ConfigManager.h"

namespace Scraper {
namespace Auth {

struct TokenPayload {
    std::string user_id;
    std::string username;
    // Add other claims as needed
};

class JWTUtils {
public:
    static std::string generateToken(const TokenPayload& payload) {
        const auto& config = Scraper::Config::ConfigManager::getInstance();
        std::string secret = config.getString("JWT_SECRET", "supersecretkey");
        int expires_in_minutes = config.getInt("JWT_EXPIRES_IN_MINUTES", 60);

        auto token = jwt::create()
            .set_issuer("scraper-api")
            .set_type("JWT")
            .set_id(payload.user_id) // Use user_id as token ID
            .set_issued_at(std::chrono::system_clock::now())
            .set_expires_at(std::chrono::system_clock::now() + std::chrono::minutes{expires_in_minutes})
            .set_payload_claim("user_id", jwt::claim(payload.user_id))
            .set_payload_claim("username", jwt::claim(payload.username))
            .sign(jwt::algorithm::hs256{secret});

        Scraper::Utils::Logger::get_logger()->info("Generated JWT for user_id: {}", payload.user_id);
        return token;
    }

    static std::optional<TokenPayload> verifyToken(const std::string& token) {
        const auto& config = Scraper::Config::ConfigManager::getInstance();
        std::string secret = config.getString("JWT_SECRET", "supersecretkey");

        try {
            auto verifier = jwt::verify()
                .allow_algorithm(jwt::algorithm::hs256{secret})
                .with_issuer("scraper-api");

            auto decoded_token = jwt::decode(token);
            verifier.verify(decoded_token);

            TokenPayload payload;
            if (decoded_token.has_payload_claim("user_id")) {
                payload.user_id = decoded_token.get_payload_claim("user_id").as_string();
            } else {
                Scraper::Utils::Logger::get_logger()->warn("JWT missing user_id claim.");
                return std::nullopt;
            }
            if (decoded_token.has_payload_claim("username")) {
                payload.username = decoded_token.get_payload_claim("username").as_string();
            } else {
                Scraper::Utils::Logger::get_logger()->warn("JWT missing username claim.");
                return std::nullopt;
            }

            Scraper::Utils::Logger::get_logger()->info("Verified JWT for user_id: {}", payload.user_id);
            return payload;

        } catch (const jwt::error::token_verification_exception& e) {
            Scraper::Utils::Logger::get_logger()->warn("JWT verification failed: {}", e.what());
        } catch (const std::exception& e) {
            Scraper::Utils::Logger::get_logger()->error("Error decoding/verifying JWT: {}", e.what());
        }
        return std::nullopt;
    }
};

} // namespace Auth
} // namespace Scraper

#endif // JWT_UTILS_H
```