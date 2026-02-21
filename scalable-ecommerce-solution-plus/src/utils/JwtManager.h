```cpp
#pragma once

#include <string>
#include <jwt-cpp/jwt.h>
#include <optional>
#include <vector>

namespace ECommerce {
    namespace Utils {

        struct JwtPayload {
            long userId;
            std::string username;
            std::string role;
            std::string email; // Example: could be included
        };

        class JwtManager {
        public:
            JwtManager(const std::string& secret, int expiryHours = 24);

            std::string generateToken(long userId, const std::string& username, const std::string& role, const std::string& email = "");
            std::optional<JwtPayload> verifyToken(const std::string& token);

        private:
            std::string _secret;
            int _expiryHours;
            jwt::verifier<jwt::default_clock, jwt::traits::nlohmann_json> _verifier;
        };

    }
}
```