#pragma once

#include <string>
#include <chrono>
#include <jwt-cpp/jwt.h>
#include "common/Enums.h"

namespace cms {

struct TokenPayload {
    std::string userId;
    UserRole role;
    std::string tokenType; // "access" or "refresh"
};

class TokenService {
public:
    static TokenService& instance();

    std::string generateAccessToken(const std::string& userId, UserRole role);
    std::string generateRefreshToken(const std::string& userId, UserRole role);
    
    // Verifies a token and extracts its payload.
    // Throws jwt::error exception if token is invalid or expired.
    TokenPayload verifyToken(const std::string& token);

    // Blacklists a token (e.g., for logout)
    void blacklistToken(const std::string& token);
    
    // Checks if a token is blacklisted
    bool isTokenBlacklisted(const std::string& token);

private:
    TokenService();
    // Delete copy constructor and assignment operator for singleton
    TokenService(const TokenService&) = delete;
    TokenService& operator=(const TokenService&) = delete;

    std::string secret_;
    int accessTokenExpiryMinutes_;
    int refreshTokenExpiryDays_;

    std::string generateToken(const std::string& userId, UserRole role, const std::string& type,
                              std::chrono::seconds expiryDuration);
};

} // namespace cms
```