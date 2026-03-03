```cpp
#pragma once

#include <string>
#include <json/json.h> // For Json::Value
#include <optional>

namespace ApexContent::Utils {

class JwtManager {
public:
    static void init(const std::string& secret, long expires_in_seconds, long refresh_expires_in_seconds);

    // Generate an access token and a refresh token
    static std::pair<std::string, std::string> generateTokens(int userId, const std::string& username, const std::vector<std::string>& roles);

    // Verify an access token and extract claims
    static std::optional<Json::Value> verifyAccessToken(const std::string& token);

    // Verify a refresh token and extract claims
    static std::optional<Json::Value> verifyRefreshToken(const std::string& token);

private:
    static std::string secret_key_;
    static long access_token_expiration_seconds_;
    static long refresh_token_expiration_seconds_;

    static std::string generateToken(const Json::Value& claims, long expires_in_seconds);
    static std::optional<Json::Value> decodeToken(const std::string& token);
};

} // namespace ApexContent::Utils
```