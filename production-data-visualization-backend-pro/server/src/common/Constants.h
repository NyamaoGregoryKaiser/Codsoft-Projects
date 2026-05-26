#pragma once

#include <string>

namespace Constants {
    const std::string API_VERSION = "/api/v1";
    const std::string JWT_SECRET = "your_super_secret_jwt_key_should_be_long_and_random"; // IN PRODUCTION, LOAD FROM ENV!
    const std::string AUTH_HEADER = "Authorization";
    const std::string BEARER_PREFIX = "Bearer ";

    const std::string DB_CONNECTION_STRING_ENV = "DATABASE_URL";
    const std::string SERVER_PORT_ENV = "SERVER_PORT";
}
```