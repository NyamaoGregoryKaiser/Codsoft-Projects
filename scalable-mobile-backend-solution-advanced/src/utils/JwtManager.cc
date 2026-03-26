```cpp
#include "JwtManager.h"
#include "Logger.h"
#include <jwt-cpp/jwt.h> // Include actual jwt-cpp header
#include <iostream>

std::string JwtManager::s_jwtSecret = "";

void JwtManager::init(const std::string& secret) {
    s_jwtSecret = secret;
    LOG_INFO("JwtManager initialized with secret.");
}

std::string JwtManager::generateToken(const std::string& userId, const std::string& username,
                                     const std::vector<std::string>& roles,
                                     long expiresInMinutes) {
    if (s_jwtSecret.empty()) {
        LOG_ERROR("JWT secret not initialized. Cannot generate token.");
        return "";
    }

    try {
        auto token = jwt::create()
            .set_issuer("mobile-backend")
            .set_type("JWT")
            .set_issued_at(std::chrono::system_clock::now())
            .set_expires_at(std::chrono::system_clock::now() + std::chrono::minutes{expiresInMinutes})
            .set_payload_claim("user_id", jwt::claim(userId))
            .set_payload_claim("username", jwt::claim(username))
            .set_payload_claim("roles", jwt::claim(roles))
            .sign(jwt::algorithm::hs256{s_jwtSecret});

        LOG_DEBUG("JWT generated for user_id: {}", userId);
        return token;
    } catch (const std::exception& e) {
        LOG_ERROR("Error generating JWT: {}", e.what());
        return "";
    }
}

Json::Value JwtManager::verifyToken(const std::string& token) {
    if (s_jwtSecret.empty()) {
        LOG_ERROR("JWT secret not initialized. Cannot verify token.");
        return Json::Value(); // Return empty Json::Value
    }

    try {
        auto verifier = jwt::verify()
            .allow_algorithm(jwt::algorithm::hs256{s_jwtSecret})
            .with_issuer("mobile-backend");

        auto decoded_token = jwt::decode(token);
        verifier.verify(decoded_token); // Throws if verification fails

        Json::Value claims;
        claims["user_id"] = decoded_token.get_payload_claim("user_id").as_string();
        claims["username"] = decoded_token.get_payload_claim("username").as_string();
        
        Json::Value roles_array(Json::arrayValue);
        auto roles_vec = decoded_token.get_payload_claim("roles").as_array();
        for (const auto& role : roles_vec) {
            roles_array.append(role.as_string());
        }
        claims["roles"] = roles_array;

        LOG_DEBUG("JWT verified for user_id: {}", claims["user_id"].asString());
        return claims;
    } catch (const jwt::verification_error& e) {
        LOG_WARN("JWT verification failed: {}", e.what());
    } catch (const std::exception& e) {
        LOG_ERROR("Error verifying JWT: {}", e.what());
    }
    return Json::Value(); // Return empty Json::Value on failure
}
```