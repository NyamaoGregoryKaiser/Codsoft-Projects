#include "TokenService.h"
#include "config/AppConfig.h"
#include "utils/Logger.h"
#include "common/Constants.h"
#include "services/CacheService.h" // For blacklisting tokens

namespace cms {

TokenService::TokenService()
    : secret_(AppConfig::getString("jwt_secret", "default_secret_please_change"))
    , accessTokenExpiryMinutes_(AppConfig::getInt("jwt_access_token_expiry_minutes", 60))
    , refreshTokenExpiryDays_(AppConfig::getInt("jwt_refresh_token_expiry_days", 7))
{
    if (secret_ == "default_secret_please_change") {
        LOG_WARN("JWT secret is using default value. Please change 'jwt_secret' in config for production.");
    }
    LOG_INFO("TokenService initialized. Access token expiry: {} mins, Refresh token expiry: {} days.",
             accessTokenExpiryMinutes_, refreshTokenExpiryDays_);
}

TokenService& TokenService::instance() {
    static TokenService instance;
    return instance;
}

std::string TokenService::generateAccessToken(const std::string& userId, UserRole role) {
    return generateToken(userId, role, "access",
                         std::chrono::minutes(accessTokenExpiryMinutes_));
}

std::string TokenService::generateRefreshToken(const std::string& userId, UserRole role) {
    return generateToken(userId, role, "refresh",
                         std::chrono::hours(24 * refreshTokenExpiryDays_));
}

std::string TokenService::generateToken(const std::string& userId, UserRole role, const std::string& type,
                                         std::chrono::seconds expiryDuration) {
    auto now = std::chrono::system_clock::now();
    auto expiresAt = now + expiryDuration;

    return jwt::create()
        .set_issuer("cms-system")
        .set_type("JWT")
        .set_issued_at(now)
        .set_expires_at(expiresAt)
        .set_payload_claim(JWT_CLAIM_USER_ID, jwt::claim(userId))
        .set_payload_claim(JWT_CLAIM_ROLE, jwt::claim(userRoleToString(role)))
        .set_payload_claim(JWT_CLAIM_TYPE, jwt::claim(type))
        .sign(jwt::algorithm::hs256{secret_});
}

TokenPayload TokenService::verifyToken(const std::string& token) {
    if (token.empty()) {
        throw jwt::error::signature_verification_exception("Empty token provided.");
    }

    try {
        auto decoded_token = jwt::decode(token);
        
        // Verify signature
        auto verifier = jwt::verify()
                            .allow_algorithm(jwt::algorithm::hs256{secret_})
                            .with_issuer("cms-system");
        
        verifier.verify(decoded_token);

        // Check if token is blacklisted
        if (isTokenBlacklisted(token)) {
            LOG_WARN("Attempted to use blacklisted token.");
            throw jwt::error::token_verification_exception("Token has been blacklisted.");
        }

        TokenPayload payload;
        payload.userId = decoded_token.get_payload_claim(JWT_CLAIM_USER_ID).as_string();
        payload.role = stringToUserRole(decoded_token.get_payload_claim(JWT_CLAIM_ROLE).as_string());
        payload.tokenType = decoded_token.get_payload_claim(JWT_CLAIM_TYPE).as_string();

        return payload;
    } catch (const jwt::error::token_verification_exception& e) {
        LOG_WARN("JWT verification failed: {}", e.what());
        throw; // Re-throw specific JWT errors
    } catch (const jwt::error::signature_verification_exception& e) {
        LOG_WARN("JWT signature verification failed: {}", e.what());
        throw;
    } catch (const jwt::error::decode_error& e) {
        LOG_WARN("JWT decoding failed: {}", e.what());
        throw;
    } catch (const std::runtime_error& e) { // Catch other potential jwt-cpp errors
        LOG_WARN("JWT runtime error: {}", e.what());
        throw;
    }
}

void TokenService::blacklistToken(const std::string& token) {
    auto decoded_token = jwt::decode(token);
    auto expires_at = decoded_token.get_expires_at();
    auto now = std::chrono::system_clock::now();
    
    // Calculate remaining expiry duration for blacklisting in Redis
    auto duration = std::chrono::duration_cast<std::chrono::seconds>(expires_at - now);
    if (duration.count() > 0) {
        CacheService::instance().set(CACHE_KEY_BLACKLIST_PREFIX + token, "1", duration.count());
        LOG_INFO("Token blacklisted for {} seconds.", duration.count());
    } else {
        LOG_DEBUG("Token already expired, no need to blacklist: {}", token);
    }
}

bool TokenService::isTokenBlacklisted(const std::string& token) {
    return CacheService::instance().exists(CACHE_KEY_BLACKLIST_PREFIX + token);
}

} // namespace cms
```