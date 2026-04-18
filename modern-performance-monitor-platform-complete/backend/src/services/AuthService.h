```cpp
#ifndef PERFOMETRICS_AUTHSERVICE_H
#define PERFOMETRICS_AUTHSERVICE_H

#include "../db/DBManager.h"
#include "../models/User.h"
#include "../dto/AuthDTO.h"
#include "../utils/Logger.h"
#include "jwt-cpp/jwt.h"
#include <string>
#include <optional>

class AuthService {
public:
    AuthService();
    LoginResponseDTO login_user(const LoginRequestDTO& request);
    std::optional<User> validate_token(const std::string& token);
    std::string hash_password(const std::string& password);
    bool verify_password(const std::string& password, const std::string& hashed_password);

private:
    std::string jwt_secret;
    std::string generate_token(const User& user);
    std::optional<User> get_user_by_username(const std::string& username);
};

#endif //PERFOMETRICS_AUTHSERVICE_H
```