```cpp
#ifndef OPTIDB_AUTH_SERVICE_H
#define OPTIDB_AUTH_SERVICE_H

#include <string>
#include <memory>
#include <optional>
#include <bcrypt/BCrypt.hpp> // For password hashing
#include <pqxx/pqxx>
#include <nlohmann/json.hpp>

#include "db/postgres_connection.h"
#include "models/user.h"
#include "utils/jwt_manager.h"
#include "utils/logger.h"
#include "common/exceptions.h"

class AuthService {
public:
    AuthService(std::shared_ptr<PostgresConnection> db_conn, std::shared_ptr<JWTManager> jwt_manager);

    User register_user(const std::string& username, const std::string& email, const std::string& password);
    std::string login_user(const std::string& username, const std::string& password); // Returns JWT token
    std::optional<User> get_user_by_id(long user_id);
    // JWT validation is handled by JWTManager and AuthMiddleware

private:
    std::shared_ptr<PostgresConnection> db_conn_;
    std::shared_ptr<JWTManager> jwt_manager_;

    std::string hash_password(const std::string& password);
    bool verify_password(const std::string& password, const std::string& hashed_password);
    std::optional<User> find_user_by_username(const std::string& username);
};

#endif // OPTIDB_AUTH_SERVICE_H
```