```cpp
#ifndef PERFOMETRICS_AUTHDTO_H
#define PERFOMETRICS_AUTHDTO_H

#include <string>
#include "nlohmann/json.hpp"

// Request DTO for user login
struct LoginRequestDTO {
    std::string username;
    std::string password;

    NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(LoginRequestDTO, username, password)
};

// Response DTO for successful login
struct LoginResponseDTO {
    std::string token;
    std::string username;
    std::string role;

    NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(LoginResponseDTO, token, username, role)
};

#endif //PERFOMETRICS_AUTHDTO_H
```