#include "JWTManager.h"
#include "../config/Config.h"
#include "../logger/Logger.h"
#include <chrono>
#include <ctime>

std::string JWTManager::generateToken(int userId, const std::string& username, UserRole role,
                                      const std::string& secret, long expiresMinutes, const std::string& tokenType) {
    try {
        // Current time plus expiration
        auto now = std::chrono::system_clock::now();
        auto expires_at = now + std::chrono::minutes{expiresMinutes};
        long exp_timestamp = std::chrono::duration_cast<std::chrono::seconds>(expires_at.time_since_epoch()).count();

        std::string token = jwt::create()
            .set_type("JWT")
            .set_issuer("auth-system")
            .set_subject(std::to_string(userId))
            .set_issued_at(std::chrono::system_clock::now())
            .set_expires_at(std::chrono::system_clock::now() + std::chrono::minutes{expiresMinutes})
            .set_payload_claim("userId", jwt::claim(std::to_string(userId)))
            .set_payload_claim("username", jwt::claim(username))
            .set_payload_claim("role", jwt::claim(userRoleToString(role)))
            .set_payload_claim("tokenType", jwt::claim(tokenType)) // Differentiate access/refresh tokens
            .sign(jwt::algorithm::hs256{secret});

        Logger::getLogger()->debug("Generated {} token for user ID {}. Expires at {}", tokenType, userId, exp_timestamp);
        return token;
    } catch (const std::exception& e) {
        Logger::getLogger()->error("Error generating {} token for user ID {}: {}", tokenType, userId, e.what());
        throw;
    }
}

std::string JWTManager::generateAccessToken(int userId, const std::string& username, UserRole role) {
    return generateToken(userId, username, role, Config::getJwtSecret(), Config::getJwtAccessExpirationMinutes(), "access");
}

std::string JWTManager::generateRefreshToken(int userId, const std::string& username, UserRole role) {
    return generateToken(userId, username, role, Config::getJwtRefreshSecret(), Config::getJwtRefreshExpirationMinutes(), "refresh");
}

std::optional<TokenClaims> JWTManager::decodeToken(const std::string& token, const std::string& secret) {
    try {
        auto verifier = jwt::verify()
            .allow_algorithm(jwt::algorithm::hs256{secret})
            .with_issuer("auth-system");

        auto decoded = jwt::decode(token);
        verifier.verify(decoded); // This will throw if invalid or expired

        TokenClaims claims;
        claims.userId = std::stoi(decoded.get_payload_claim("userId").as_string());
        claims.username = decoded.get_payload_claim("username").as_string();
        claims.role = stringToUserRole(decoded.get_payload_claim("role").as_string());
        claims.tokenType = decoded.get_payload_claim("tokenType").as_string();

        Logger::getLogger()->debug("Token decoded successfully for user ID {}.", claims.userId);
        return claims;

    } catch (const jwt::expired_token_exception& e) {
        Logger::getLogger()->warn("Expired token: {}", e.what());
        return std::nullopt;
    } catch (const std::exception& e) {
        Logger::getLogger()->warn("Invalid token: {}", e.what());
        return std::nullopt;
    }
}

bool JWTManager::verifyToken(const std::string& token, const std::string& secret) {
    try {
        auto verifier = jwt::verify()
            .allow_algorithm(jwt::algorithm::hs256{secret})
            .with_issuer("auth-system");

        auto decoded = jwt::decode(token);
        verifier.verify(decoded); // This will throw if invalid or expired
        return true;
    } catch (const std::exception& e) {
        Logger::getLogger()->debug("Token verification failed: {}", e.what());
        return false;
    }
}