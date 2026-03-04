```cpp
#ifndef OPTIDB_CONFIG_H
#define OPTIDB_CONFIG_H

#include <string>
#include <stdexcept>
#include <cstdlib> // For getenv

struct OptiDBConfig {
    std::string db_host;
    std::string db_port;
    std::string db_name;
    std::string db_user;
    std::string db_password;

    std::string jwt_secret;
    long jwt_expiry_seconds;

    int server_port;
    std::string log_level; // DEBUG, INFO, WARN, ERROR, CRITICAL

    // Target DB specific config (for internal connections)
    int target_db_connection_timeout_ms;
    int target_db_max_concurrent_connections;

    OptiDBConfig() {
        // Read from environment variables
        db_host = get_env_var("DB_HOST", "localhost");
        db_port = get_env_var("DB_PORT", "5432");
        db_name = get_env_var("DB_NAME", "optidb");
        db_user = get_env_var("DB_USER", "optidb_user");
        db_password = get_env_var("DB_PASSWORD", "optidb_password"); // SHOULD BE SECURELY MANAGED IN PROD

        jwt_secret = get_env_var("JWT_SECRET"); // Must be set
        if (jwt_secret.empty()) {
            throw std::runtime_error("JWT_SECRET environment variable is not set.");
        }
        jwt_expiry_seconds = std::stol(get_env_var("JWT_EXPIRY_SECONDS", "3600"));

        server_port = std::stoi(get_env_var("SERVER_PORT", "18080"));
        log_level = get_env_var("LOG_LEVEL", "INFO");

        target_db_connection_timeout_ms = std::stoi(get_env_var("TARGET_DB_CONN_TIMEOUT_MS", "5000"));
        target_db_max_concurrent_connections = std::stoi(get_env_var("TARGET_DB_MAX_CONN", "5"));
    }

private:
    std::string get_env_var(const std::string& key, const std::string& default_val = "") {
        char* val = std::getenv(key.c_str());
        if (val == nullptr) {
            return default_val;
        }
        return std::string(val);
    }
};

#endif // OPTIDB_CONFIG_H
```