#pragma once

#include <string>
#include <chrono>
#include <jwt-cpp/jwt.h>
#include <stdexcept>
#include <vector>

#include "app_config.h"
#include "logger.h"

namespace Security {

struct TokenClaims {
    std::string userId;
    std::string role;
    std::string type; // "access" or "refresh"
};

class JwtManager {
public:
    JwtManager() {
        // Ensure config is loaded before using
        AppConfig::Config::getInstance();
    }

    std::string generateAccessToken(const std::string& userId, const std::string& role) const {
        return generateToken(userId, role, "access", AppConfig::Config::getInstance().jwt_expiration_seconds);
    }

    std::string generateRefreshToken(const std::string& userId, const std::string& role) const {
        return generateToken(userId, role, "refresh", AppConfig::Config::getInstance().jwt_refresh_expiration_seconds);
    }

    TokenClaims verifyToken(const std::string& token) const {
        try {
            auto verifier = jwt::verify()
                                .allow_algorithm(jwt::algorithm::hs256(AppConfig::Config::getInstance().jwt_secret));
            auto decoded_token = verifier.verify(token);

            // Extract claims
            std::string userId = decoded_token.get_payload_claim("userId").as_string();
            std::string role = decoded_token.get_payload_claim("role").as_string();
            std::string type = decoded_token.get_payload_claim("type").as_string();

            return {userId, role, type};

        } catch (const jwt::error::token_verification_exception& e) {
            LOG_DEBUG("JWT verification failed: {}", e.what());
            throw std::runtime_error("Invalid or expired token");
        } catch (const std::exception& e) {
            LOG_ERROR("Error verifying token: {}", e.what());
            throw std::runtime_error("Failed to verify token");
        }
    }

private:
    std::string generateToken(const std::string& userId, const std::string& role, const std::string& type, int expiration_seconds) const {
        auto now = std::chrono::system_clock::now();
        auto expires_at = now + std::chrono::seconds(expiration_seconds);

        return jwt::create()
            .set_type("JWT")
            .set_issuer("secure-cpp-app")
            .set_issued_at(now)
            .set_expires_at(expires_at)
            .set_payload_claim("userId", jwt::claim(userId))
            .set_payload_claim("role", jwt::claim(role))
            .set_payload_claim("type", jwt::claim(type))
            .sign(jwt::algorithm::hs256(AppConfig::Config::getInstance().jwt_secret));
    }
};

} // namespace Security