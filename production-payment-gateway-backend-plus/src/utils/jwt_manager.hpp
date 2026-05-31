```cpp
#ifndef ZENITH_JWT_MANAGER_HPP
#define ZENITH_JWT_MANAGER_HPP

#include <string>
#include <chrono>
#include <optional>
#include <jwt-cpp/jwt.h>
#include "../config/config.hpp"
#include "../utils/logger.hpp"

namespace Zenith {
namespace Utils {

struct JwtPayload {
    long user_id;
    std::string username;
    std::string email;
    std::string role;
};

class JwtManager {
public:
    static JwtManager& getInstance();

    std::string generateToken(const JwtPayload& payload);
    std::optional<JwtPayload> verifyToken(const std::string& token);

private:
    JwtManager();
    JwtManager(const JwtManager&) = delete;
    JwtManager& operator=(const JwtManager&) = delete;

    const std::string& secret_;
    const long expiration_seconds_;
};

} // namespace Utils
} // namespace Zenith

#endif // ZENITH_JWT_MANAGER_HPP
```