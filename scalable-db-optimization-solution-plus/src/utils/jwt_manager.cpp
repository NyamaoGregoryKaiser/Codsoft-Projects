```cpp
#include "jwt_manager.h"

JWTManager::JWTManager(const OptiDBConfig& config)
    : jwt_secret_(config.jwt_secret), jwt_expiry_seconds_(config.jwt_expiry_seconds) {}

std::string JWTManager::generate_token(long user_id, const std::string& username) {
    auto now = std::chrono::system_clock::now();
    auto expires_at = now + std::chrono::seconds(jwt_expiry_seconds_);

    std::string token = jwt::create()
        .set_issuer("optidb-auth")
        .set_type("JWT")
        .set_subject(std::to_string(user_id))
        .set_issued_at(std::chrono::system_clock::to_time_t(now))
        .set_expires_at(std::chrono::system_clock::to_time_t(expires_at))
        .set_payload({
            {"user_id", user_id},
            {"username", username}
        })
        .sign(jwt::algorithm::hs256{jwt_secret_});

    LOG_DEBUG("Generated JWT token for user_id: {}", user_id);
    return token;
}

long JWTManager::validate_token(const std::string& token) {
    try {
        auto decoded_token = jwt::decode(token);
        
        jwt::verifier verifier = jwt::verify()
            .allow_algorithm(jwt::algorithm::hs256{jwt_secret_})
            .with_issuer("optidb-auth");
        
        verifier.verify(decoded_token);

        // Check if user_id claim exists and is a number
        if (!decoded_token.has_payload_claim("user_id")) {
            throw UnauthorizedException("JWT token missing user_id claim.");
        }
        return decoded_token.get_payload_claim("user_id").as_int();

    } catch (const jwt::verification_error& e) {
        LOG_WARN("JWT validation failed: {}", e.what());
        throw UnauthorizedException("Invalid or expired token.");
    } catch (const jwt::error::signature_verification_exception& e) {
        LOG_WARN("JWT signature verification failed: {}", e.what());
        throw UnauthorizedException("Invalid token signature.");
    } catch (const jwt::error::token_verification_exception& e) {
        LOG_WARN("JWT token verification failed: {}", e.what());
        throw UnauthorizedException("Token validation failed: " + std::string(e.what()));
    } catch (const std::exception& e) {
        LOG_ERROR("Error validating JWT token: {}", e.what());
        throw UnauthorizedException("Error processing token.");
    }
}
```