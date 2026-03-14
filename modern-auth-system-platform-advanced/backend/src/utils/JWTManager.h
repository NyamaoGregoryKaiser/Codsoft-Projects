#ifndef AUTH_SYSTEM_JWTMANAGER_H
#define AUTH_SYSTEM_JWTMANAGER_H

#include <string>
#include <optional>
#include <jwt-cpp/jwt.h> // From jwt-cpp library
#include "../models/User.h" // For UserRole enum

struct TokenClaims {
    int userId;
    std::string username;
    UserRole role;
    std::string tokenType; // "access" or "refresh"
};

class JWTManager {
public:
    static std::string generateAccessToken(int userId, const std::string& username, UserRole role);
    static std::string generateRefreshToken(int userId, const std::string& username, UserRole role);

    static std::optional<TokenClaims> decodeToken(const std::string& token, const std::string& secret);
    static bool verifyToken(const std::string& token, const std::string& secret);

private:
    static std::string generateToken(int userId, const std::string& username, UserRole role,
                                     const std::string& secret, long expiresMinutes, const std::string& tokenType);
};

#endif // AUTH_SYSTEM_JWTMANAGER_H