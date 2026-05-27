#ifndef ML_UTILITIES_SYSTEM_JWT_MANAGER_HPP
#define ML_UTILITIES_SYSTEM_JWT_MANAGER_HPP

#include <string>
#include <chrono>
#include <jwt-cpp/jwt.h>
#include "../common/constants.hpp" // For token claims
#include "../utils/logger.hpp"

/**
 * @brief Manages JWT (JSON Web Token) creation and validation.
 *
 * This class provides static methods to sign and verify JWTs,
 * including user ID and role claims.
 */
class JWTManager {
private:
    static std::string jwt_secret;
    static int jwt_expiration_hours;
    static bool initialized;

    JWTManager() = delete; // Prevent instantiation

public:
    /**
     * @brief Initializes the JWT Manager with the secret and expiration.
     * @param secret The secret key used for signing and verifying tokens.
     * @param expiration_hours The number of hours until a token expires.
     */
    static void init(const std::string& secret, int expiration_hours) {
        if (initialized) {
            LOG_WARN("JWTManager already initialized. Skipping re-initialization.");
            return;
        }
        if (secret.empty()) {
            LOG_CRITICAL("JWT secret cannot be empty.");
            throw std::runtime_error("JWT secret not provided.");
        }
        jwt_secret = secret;
        jwt_expiration_hours = expiration_hours;
        initialized = true;
        LOG_INFO("JWTManager initialized with expiration: {} hours.", expiration_hours);
    }

    /**
     * @brief Creates a new JWT for a given user.
     * @param user_id The ID of the user.
     * @param user_role The role of the user.
     * @return A signed JWT string.
     */
    static std::string createToken(int user_id, const std::string& user_role) {
        if (!initialized) {
            LOG_CRITICAL("JWTManager not initialized. Call init() first.");
            throw std::runtime_error("JWTManager not initialized.");
        }

        auto now = std::chrono::system_clock::now();
        auto expires_at = now + std::chrono::hours(jwt_expiration_hours);

        std::string token = jwt::create()
            .set_issuer(Constants::JWT_ISSUER)
            .set_type("JWT")
            .set_issued_at(now)
            .set_expires_at(expires_at)
            .set_payload_claim(Constants::CLAIM_USER_ID, jwt::claim(std::to_string(user_id)))
            .set_payload_claim(Constants::CLAIM_USER_ROLE, jwt::claim(user_role))
            .sign(jwt::algorithm::hs256{jwt_secret});

        LOG_DEBUG("Created JWT for user_id: {}. Expires in {} hours.", user_id, jwt_expiration_hours);
        return token;
    }

    /**
     * @brief Verifies a JWT and extracts its claims.
     * @param token The JWT string to verify.
     * @return A `jwt::decoded_jwt` object if verification is successful.
     * @throws jwt::error::signature_verification_exception if signature is invalid.
     * @throws jwt::error::token_verification_exception if token is expired or has invalid claims.
     * @throws std::runtime_error if JWTManager is not initialized.
     */
    static jwt::decoded_jwt verifyToken(const std::string& token) {
        if (!initialized) {
            LOG_CRITICAL("JWTManager not initialized. Call init() first.");
            throw std::runtime_error("JWTManager not initialized.");
        }

        auto verifier = jwt::verify()
            .allow_algorithm(jwt::algorithm::hs256{jwt_secret})
            .with_issuer(Constants::JWT_ISSUER);

        jwt::decoded_jwt decoded_token = jwt::decode(token);
        verifier.verify(decoded_token);

        LOG_DEBUG("JWT verified for user_id: {}", decoded_token.get_payload_claim(Constants::CLAIM_USER_ID).as_string());
        return decoded_token;
    }
};

// Static members initialization
std::string JWTManager::jwt_secret;
int JWTManager::jwt_expiration_hours = 0;
bool JWTManager::initialized = false;

#endif // ML_UTILITIES_SYSTEM_JWT_MANAGER_HPP
```