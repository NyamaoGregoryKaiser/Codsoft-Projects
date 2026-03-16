```cpp
#include "JWTManager.h"
#include "Logger.h"
#include <chrono>

std::string JWTManager::secret_key;
std::string JWTManager::issuer;
int JWTManager::expiry_minutes;

void JWTManager::init(const std::string& secret, const std::string& iss, int expiry_mins) {
    secret_key = secret;
    issuer = iss;
    expiry_minutes = expiry_mins;
    Logger::info("JWTManager initialized with issuer '{}' and expiry {} minutes.", issuer, expiry_minutes);
}

std::string JWTManager::generateToken(long long user_id, const std::string& username, const std::string& email) {
    if (secret_key.empty()) {
        Logger::error("JWT secret key not set. Cannot generate token.");
        throw std::runtime_error("JWT secret key not set.");
    }

    auto now = std::chrono::system_clock::now();
    auto expires_at = now + std::chrono::minutes(expiry_minutes);

    return jwt::create()
        .set_issuer(issuer)
        .set_subject(std::to_string(user_id))
        .set_type("JWT")
        .set_issued_at(std::chrono::system_clock::to_time_t(now))
        .set_expires_at(std::chrono::system_clock::to_time_t(expires_at))
        .set_payload_claim("user_id", jwt::claim(std::to_string(user_id)))
        .set_payload_claim("username", jwt::claim(username))
        .set_payload_claim("email", jwt::claim(email))
        .sign(jwt::algorithm::hs256{secret_key});
}

std::optional<nlohmann::json> JWTManager::verifyToken(const std::string& token) {
    if (secret_key.empty()) {
        Logger::error("JWT secret key not set. Cannot verify token.");
        return std::nullopt;
    }

    try {
        auto decoded_token = jwt::decode(token);
        auto verifier = jwt::verify()
            .allow_algorithm(jwt::algorithm::hs256{secret_key})
            .with_issuer(issuer);

        verifier.verify(decoded_token);

        nlohmann::json payload_claims;
        for (auto const& [key, value] : decoded_token.get_payload_claims()) {
            if (value.is_integer()) {
                payload_claims[key] = value.as_int();
            } else if (value.is_string()) {
                payload_claims[key] = value.as_string();
            } else if (value.is_boolean()) {
                payload_claims[key] = value.as_bool();
            }
            // Add other types as needed
        }
        
        return payload_claims;

    } catch (const jwt::error::signature_verification_exception& e) {
        Logger::warn("JWT signature verification failed: {}", e.what());
        return std::nullopt;
    } catch (const jwt::error::token_verification_exception& e) {
        Logger::warn("JWT token verification failed (expired/invalid claims): {}", e.what());
        return std::nullopt;
    } catch (const std::exception& e) {
        Logger::error("Error verifying JWT token: {}", e.what());
        return std::nullopt;
    }
}
```