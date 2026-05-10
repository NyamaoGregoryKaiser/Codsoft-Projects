```cpp
#include "AuthService.h"
#include "../config/Config.h"
#include "../utils/Logger.h"

// For Argon2 salt generation
#include <random>
#include <sstream>
#include <algorithm> // For std::min

AuthService::AuthService(std::shared_ptr<Database> db) 
    : db_(std::move(db)),
      jwtSecret_(Config::getJwtSecret()),
      accessTokenExpirationSeconds_(Config::getJwtAccessTokenExpirationSeconds()),
      refreshTokenExpirationSeconds_(Config::getJwtRefreshTokenExpirationSeconds()) {
    
    if (jwtSecret_.empty() || jwtSecret_ == "supersecretjwtkeythatshouldbemorethan256bitlongandrandomlygeneratedinproduction") {
        LOG_FATAL("JWT_SECRET is not configured or is using default insecure value. This is a critical security risk.");
        throw AuthException("JWT_SECRET is not configured or is insecure.");
    }
    LOG_INFO("AuthService initialized.");
}

std::string AuthService::hashPassword(const std::string& password) const {
    if (password.empty()) {
        throw AuthException("Password cannot be empty.");
    }

    // Generate a random salt
    std::random_device rd;
    std::uniform_int_distribution<unsigned char> dist(0, 255);
    std::vector<unsigned char> salt(salt_len_);
    for (size_t i = 0; i < salt_len_; ++i) {
        salt[i] = dist(rd);
    }

    char hash_str[ARGON2_MAX_PWR_LENGTH]; // Buffer for encoded hash string

    int rc = argon2id_hash_encoded(
        t_cost_,
        m_cost_,
        parallelism_,
        password.c_str(),
        password.length(),
        salt.data(),
        salt_len_,
        hash_len_,
        hash_str,
        sizeof(hash_str)
    );

    if (rc != ARGON2_OK) {
        LOG_ERROR("Argon2 hashing failed: %s", argon2_error_message(rc));
        throw AuthException("Password hashing failed.");
    }

    LOG_DEBUG("Password hashed successfully.");
    return std::string(hash_str);
}

bool AuthService::verifyPassword(const std::string& password, const std::string& hash) const {
    if (password.empty() || hash.empty()) {
        return false;
    }

    int rc = argon2_verify(hash.c_str(), password.c_str(), password.length());

    if (rc == ARGON2_OK) {
        LOG_DEBUG("Password verification successful.");
        return true;
    } else if (rc == ARGON2_VERIFY_MATCH) { // Some older versions or specific configurations
        LOG_DEBUG("Password verification successful (match).");
        return true;
    } else {
        LOG_WARN("Password verification failed for given hash. Error: %s", argon2_error_message(rc));
        return false;
    }
}

long AuthService::getCurrentTimestamp() const {
    return std::chrono::duration_cast<std::chrono::seconds>(
               std::chrono::system_clock::now().time_since_epoch()
           ).count();
}

std::string AuthService::generateAccessToken(const std::string& userId, const std::string& email) const {
    auto now = getCurrentTimestamp();
    return jwt::create()
        .set_type("JWT")
        .set_issuer("auth-system")
        .set_subject(userId)
        .set_audience({"auth-system-client"})
        .set_id(User::generateUuid()) // JWT ID
        .set_issued_at(now)
        .set_expires_at(now + accessTokenExpirationSeconds_)
        .set_payload_claim("email", jwt::claim(email))
        .sign(jwt::algorithm::hs256{jwtSecret_});
}

std::string AuthService::generateRefreshToken(const std::string& userId, const std::string& email) const {
    auto now = getCurrentTimestamp();
    return jwt::create()
        .set_type("JWT")
        .set_issuer("auth-system")
        .set_subject(userId)
        .set_audience({"auth-system-client"})
        .set_id(User::generateUuid()) // JWT ID
        .set_issued_at(now)
        .set_expires_at(now + refreshTokenExpirationSeconds_)
        .set_payload_claim("email", jwt::claim(email))
        // Add a type claim to distinguish refresh tokens
        .set_payload_claim("token_type", jwt::claim(std::string("refresh")))
        .sign(jwt::algorithm::hs256{jwtSecret_});
}

TokenPair AuthService::generateTokens(const std::string& userId, const std::string& email) const {
    TokenPair tokens;
    tokens.accessToken = generateAccessToken(userId, email);
    tokens.refreshToken = generateRefreshToken(userId, email);
    tokens.expiresIn = accessTokenExpirationSeconds_;
    LOG_INFO("Tokens generated for user %s", userId.c_str());
    return tokens;
}

std::optional<jwt::decoded_jwt<jwt::traits::kazuho_picojson>> AuthService::verifyAccessToken(const std::string& token) const {
    try {
        auto decoded_jwt = jwt::decode(token);
        jwt::verify_options verify_opts;
        verify_opts.allow_algorithm("HS256"); // Only allow HS256
        verify_opts.issuer = "auth-system";
        verify_opts.audience = "auth-system-client";
        verify_opts.check_signature = true; // Ensure signature is checked
        verify_opts.check_exp = true;       // Ensure expiration is checked
        verify_opts.check_iat = true;       // Ensure issued at is checked
        verify_opts.check_nbf = false;      // No need for not_before for access tokens

        jwt::verify()
            .with_algorithm(jwt::algorithm::hs256{jwtSecret_})
            .with_verifier(verify_opts)
            .verify(decoded_jwt);
        
        // Ensure this is not a refresh token accidentally sent as an access token
        if (decoded_jwt.has_payload_claim("token_type") && decoded_jwt.get_payload_claim("token_type").as_string() == "refresh") {
            LOG_WARN("Refresh token used where access token expected.");
            return std::nullopt;
        }

        LOG_DEBUG("Access token verified for subject: %s", decoded_jwt.get_subject().c_str());
        return decoded_jwt;
    } catch (const jwt::error::token_verification_error& e) {
        LOG_WARN("Access token verification failed: %s", e.what());
        return std::nullopt;
    } catch (const std::exception& e) {
        LOG_ERROR("Error decoding/verifying access token: %s", e.what());
        return std::nullopt;
    }
}

std::optional<jwt::decoded_jwt<jwt::traits::kazuho_picojson>> AuthService::verifyRefreshToken(const std::string& token) const {
    try {
        auto decoded_jwt = jwt::decode(token);
        jwt::verify_options verify_opts;
        verify_opts.allow_algorithm("HS256"); // Only allow HS256
        verify_opts.issuer = "auth-system";
        verify_opts.audience = "auth-system-client";
        verify_opts.check_signature = true; // Ensure signature is checked
        verify_opts.check_exp = true;       // Ensure expiration is checked
        verify_opts.check_iat = true;       // Ensure issued at is checked
        verify_opts.check_nbf = false;

        jwt::verify()
            .with_algorithm(jwt::algorithm::hs256{jwtSecret_})
            .with_verifier(verify_opts)
            .verify(decoded_jwt);

        // Explicitly check for refresh token type claim
        if (!decoded_jwt.has_payload_claim("token_type") || decoded_jwt.get_payload_claim("token_type").as_string() != "refresh") {
            LOG_WARN("Invalid token type for refresh token verification.");
            return std::nullopt;
        }

        LOG_DEBUG("Refresh token verified for subject: %s", decoded_jwt.get_subject().c_str());
        return decoded_jwt;
    } catch (const jwt::error::token_verification_error& e) {
        LOG_WARN("Refresh token verification failed: %s", e.what());
        return std::nullopt;
    } catch (const std::exception& e) {
        LOG_ERROR("Error decoding/verifying refresh token: %s", e.what());
        return std::nullopt;
    }
}
```