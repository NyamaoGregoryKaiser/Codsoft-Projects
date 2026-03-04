```cpp
#ifndef OPTIDB_JWT_MANAGER_H
#define OPTIDB_JWT_MANAGER_H

#include <string>
#include <ctime>
#include <chrono>
#include <jwt-cpp/jwt.h> // JWT-CPP library
#include <nlohmann/json.hpp>

#include "utils/logger.h"
#include "common/exceptions.h"
#include "config/config.h"

class JWTManager {
public:
    JWTManager(const OptiDBConfig& config);

    std::string generate_token(long user_id, const std::string& username);
    long validate_token(const std::string& token); // Throws UnauthorizedException if invalid

private:
    std::string jwt_secret_;
    long jwt_expiry_seconds_;
};

#endif // OPTIDB_JWT_MANAGER_H
```