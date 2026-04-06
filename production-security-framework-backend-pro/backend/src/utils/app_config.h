#pragma once

#include <string>
#include <cstdlib>
#include <stdexcept>
#include <iostream>

namespace AppConfig {

std::string getEnv(const std::string& name) {
    char* value = std::getenv(name.c_str());
    if (value == nullptr) {
        throw std::runtime_error("Environment variable " + name + " not set.");
    }
    return std::string(value);
}

int getEnvInt(const std::string& name) {
    return std::stoi(getEnv(name));
}

bool getEnvBool(const std::string& name) {
    std::string value = getEnv(name);
    return value == "true" || value == "1";
}

struct Config {
    // Application
    int app_port;

    // Database
    std::string db_host;
    int db_port;
    std::string db_name;
    std::string db_user;
    std::string db_password;

    // JWT
    std::string jwt_secret;
    int jwt_expiration_seconds;
    int jwt_refresh_expiration_seconds;

    // Logging
    std::string log_level;

    // Rate Limiting
    bool rate_limit_enabled;
    int rate_limit_max_requests;
    int rate_limit_window_seconds;

    static Config& getInstance() {
        static Config instance;
        return instance;
    }

private:
    Config() {
        try {
            app_port = getEnvInt("APP_PORT");
            db_host = getEnv("DB_HOST");
            db_port = getEnvInt("DB_PORT");
            db_name = getEnv("DB_NAME");
            db_user = getEnv("DB_USER");
            db_password = getEnv("DB_PASSWORD");
            jwt_secret = getEnv("JWT_SECRET");
            jwt_expiration_seconds = getEnvInt("JWT_EXPIRATION_SECONDS");
            jwt_refresh_expiration_seconds = getEnvInt("JWT_REFRESH_EXPIRATION_SECONDS");
            log_level = getEnv("LOG_LEVEL");
            rate_limit_enabled = getEnvBool("RATE_LIMIT_ENABLED");
            rate_limit_max_requests = getEnvInt("RATE_LIMIT_MAX_REQUESTS");
            rate_limit_window_seconds = getEnvInt("RATE_LIMIT_WINDOW_SECONDS");
        } catch (const std::runtime_error& e) {
            std::cerr << "Configuration error: " << e.what() << std::endl;
            exit(EXIT_FAILURE);
        }
    }

    Config(const Config&) = delete;
    Config& operator=(const Config&) = delete;
};

} // namespace AppConfig