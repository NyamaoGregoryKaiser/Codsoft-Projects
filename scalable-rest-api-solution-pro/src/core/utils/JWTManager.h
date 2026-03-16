```cpp
#ifndef JWT_MANAGER_H
#define JWT_MANAGER_H

#include <string>
#include <optional>
#include <jwt-cpp/jwt.h>
#include <nlohmann/json.hpp>

class JWTManager {
private:
    static std::string secret_key;
    static std::string issuer;
    static int expiry_minutes;

    JWTManager() = delete; // Prevent instantiation

public:
    static void init(const std::string& secret, const std::string& iss, int expiry_mins);
    static std::string generateToken(long long user_id, const std::string& username, const std::string& email);
    static std::optional<nlohmann::json> verifyToken(const std::string& token);
};

#endif // JWT_MANAGER_H
```