```cpp
#ifndef AUTH_SYSTEM_AUTH_SERVICE_H
#define AUTH_SYSTEM_AUTH_SERVICE_H

#include <string>
#include <memory>
#include <optional>
#include <chrono>

#include <jwt-cpp/jwt.h>
#include <argon2.h> // Assuming argon2-cpp uses the C library

#include "../database/Database.h"
#include "../models/User.h"

// Custom exception for authentication/authorization errors
class AuthException : public std::runtime_error {
public:
    explicit AuthException(const std::string& message) : std::runtime_error(message) {}
};

struct TokenPair {
    std::string accessToken;
    std::string refreshToken;
    long expiresIn; // Access token expiration in seconds
};

class AuthService {
public:
    explicit AuthService(std::shared_ptr<Database> db);

    // Password hashing and verification
    std::string hashPassword(const std::string& password) const;
    bool verifyPassword(const std::string& password, const std::string& hash) const;

    // JWT token generation
    TokenPair generateTokens(const std::string& userId, const std::string& email) const;
    std::string generateAccessToken(const std::string& userId, const std::string& email) const;
    std::string generateRefreshToken(const std::string& userId, const std::string& email) const;

    // JWT token verification
    std::optional<jwt::decoded_jwt<jwt::traits::kazuho_picojson>> verifyAccessToken(const std::string& token) const;
    std::optional<jwt::decoded_jwt<jwt::traits::kazuho_picojson>> verifyRefreshToken(const std::string& token) const;

    // Utility for token expiry
    long getCurrentTimestamp() const;

private:
    std::shared_ptr<Database> db_;
    std::string jwtSecret_;
    int accessTokenExpirationSeconds_;
    int refreshTokenExpirationSeconds_;

    // Argon2 parameters
    const size_t hash_len_ = 32; // 32 bytes for the hash
    const size_t salt_len_ = 16; // 16 bytes for the salt
    const uint32_t t_cost_ = 3;  // iterations
    const uint32_t m_cost_ = 4096; // memory cost (4MB)
    const uint32_t parallelism_ = 1; // number of threads
};

#endif // AUTH_SYSTEM_AUTH_SERVICE_H
```