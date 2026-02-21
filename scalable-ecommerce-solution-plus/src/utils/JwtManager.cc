```cpp
#include "JwtManager.h"
#include <spdlog/spdlog.h>
#include <chrono>

namespace ECommerce {
    namespace Utils {

        JwtManager::JwtManager(const std::string& secret, int expiryHours)
            : _secret(secret), _expiryHours(expiryHours),
              _verifier(jwt::verify().allow_algorithm(jwt::algorithm::hs256(secret))) {
            spdlog::debug("JwtManager initialized with secret and expiry {} hours.", _expiryHours);
        }

        std::string JwtManager::generateToken(long userId, const std::string& username, const std::string& role, const std::string& email) {
            auto token = jwt::create()
                .set_issuer("ecommerce-api")
                .set_type("JWT")
                .set_subject(std::to_string(userId)) // Subject is user ID
                .set_expires_at(std::chrono::system_clock::now() + std::chrono::hours(_expiryHours))
                .set_payload_claim("userId", jwt::claim(std::to_string(userId))) // Custom claims
                .set_payload_claim("username", jwt::claim(username))
                .set_payload_claim("role", jwt::claim(role))
                .set_payload_claim("email", jwt::claim(email))
                .sign(jwt::algorithm::hs256(_secret));

            spdlog::debug("Generated JWT for user ID: {}", userId);
            return token;
        }

        std::optional<JwtPayload> JwtManager::verifyToken(const std::string& token) {
            try {
                auto decoded_token = _verifier.verify(token);

                JwtPayload payload;
                payload.userId = std::stol(decoded_token.get_payload_claim("userId").as_string());
                payload.username = decoded_token.get_payload_claim("username").as_string();
                payload.role = decoded_token.get_payload_claim("role").as_string();
                payload.email = decoded_token.get_payload_claim("email").as_string(); // If email is always present

                spdlog::debug("Verified JWT for user ID: {}", payload.userId);
                return payload;
            } catch (const jwt::verification_error& e) {
                spdlog::warn("JWT verification failed: {}", e.what());
                return std::nullopt;
            } catch (const std::exception& e) {
                spdlog::error("Error processing JWT: {}", e.what());
                return std::nullopt;
            }
        }

    }
}
```