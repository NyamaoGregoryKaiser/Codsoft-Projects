#pragma once

#include <string>
#include <json/json.h> // For jwt-cpp payload
#include <jwt-cpp/jwt.h> // For JWT functionality

class JwtManager {
public:
    static std::string generateToken(const std::string& userId,
                                     const std::string& username,
                                     const std::string& role);

    static bool verifyToken(const std::string& token,
                            Json::Value& payload,
                            std::string& error);

    // Should be called during app startup with the secret from config
    static void setSecret(const std::string& secret);

private:
    static std::string jwtSecret;
    static int expiresInSeconds;
    static int refreshTokenExpiresInSeconds;
    // Static initializer to read config once
    static bool initialized;
    static void initialize();
};