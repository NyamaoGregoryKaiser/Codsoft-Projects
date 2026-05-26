#pragma once

#include <string>
#include <cstdlib> // For std::getenv
#include "utils/Logger.h"
#include "common/Constants.h"

namespace DataVizPro {

struct AppConfig {
    std::string db_connection_string;
    int server_port;
    std::string jwt_secret;

    static AppConfig load() {
        AppConfig config;

        // Load DB Connection String
        const char* db_url = std::getenv(Constants::DB_CONNECTION_STRING_ENV.c_str());
        if (db_url) {
            config.db_connection_string = db_url;
        } else {
            LOG_WARN("Environment variable {} not set. Using default local PostgreSQL connection.", Constants::DB_CONNECTION_STRING_ENV);
            config.db_connection_string = "postgresql://user:password@localhost:5432/datavizpro";
        }

        // Load Server Port
        const char* port_str = std::getenv(Constants::SERVER_PORT_ENV.c_str());
        if (port_str) {
            try {
                config.server_port = std::stoi(port_str);
            } catch (const std::exception& e) {
                LOG_ERROR("Invalid value for {} environment variable: {}. Using default port 8080.", Constants::SERVER_PORT_ENV, port_str);
                config.server_port = 8080;
            }
        } else {
            LOG_WARN("Environment variable {} not set. Using default port 8080.", Constants::SERVER_PORT_ENV);
            config.server_port = 8080;
        }

        // Load JWT Secret
        const char* jwt_secret_env = std::getenv("JWT_SECRET");
        if (jwt_secret_env) {
            config.jwt_secret = jwt_secret_env;
        } else {
            LOG_WARN("Environment variable JWT_SECRET not set. Using default insecure secret. THIS IS UNSAFE FOR PRODUCTION!");
            config.jwt_secret = Constants::JWT_SECRET;
        }

        return config;
    }
};

} // namespace DataVizPro
```