```cpp
#pragma once

#include <string>
#include <json/json.h>
#include <drogon/orm/DbClient.h>

namespace ApexContent::Service {

class AuthService {
public:
    static std::pair<std::string, std::string> login(const std::string& username, const std::string& password);
    static std::pair<std::string, std::string> registerUser(const std::string& username, const std::string& email, const std::string& password);
    static std::pair<std::string, std::string> refreshTokens(const std::string& refreshToken);

private:
    static drogon::orm::DbClientPtr dbClient_;
};

} // namespace ApexContent::Service
```