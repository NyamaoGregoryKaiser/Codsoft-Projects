#include "AppConfig.h"
#include <cstdlib> // For getenv
#include <fstream>
#include <sstream>
#include "spdlog/spdlog.h"

namespace EnvParser {
    std::map<std::string, std::string> parseEnvFile(const std::string& filepath) {
        std::map<std::string, std::string> env_vars;
        std::ifstream file(filepath);
        if (!file.is_open()) {
            spdlog::warn("Could not open .env file: {}", filepath);
            return env_vars;
        }

        std::string line;
        while (std::getline(file, line)) {
            // Remove leading/trailing whitespace
            line.erase(0, line.find_first_not_of(" \t\r\n"));
            line.erase(line.find_last_not_of(" \t\r\n") + 1);

            // Skip comments and empty lines
            if (line.empty() || line[0] == '#') {
                continue;
            }

            size_t equals_pos = line.find('=');
            if (equals_pos != std::string::npos) {
                std::string key = line.substr(0, equals_pos);
                std::string value = line.substr(equals_pos + 1);

                // Remove quotes from value if present
                if (value.length() >= 2 && value.front() == '"' && value.back() == '"') {
                    value = value.substr(1, value.length() - 2);
                }
                env_vars[key] = value;
            }
        }
        return env_vars;
    }

    std::string getEnvVar(const std::string& name, const std::string& default_value) {
        char* value = std::getenv(name.c_str());
        if (value) {
            return std::string(value);
        }
        return default_value;
    }
} // namespace EnvParser

AppConfig& AppConfig::getInstance() {
    static AppConfig instance;
    return instance;
}

void AppConfig::loadFromEnv() {
    // First, try to load from .env file (if exists in current directory)
    std::map<std::string, std::string> file_env_vars = EnvParser::parseEnvFile(".env");

    // Helper to get value, prioritizing actual env vars, then .env file, then default
    auto getValue = [&](const std::string& key, const std::string& default_val = "") {
        std::string val = EnvParser::getEnvVar(key);
        if (!val.empty()) {
            return val;
        }
        if (file_env_vars.count(key)) {
            return file_env_vars[key];
        }
        return default_val;
    };

    app_env = getValue("APP_ENV", "development");
    port = std::stoi(getValue("PORT", "8080"));
    database_path = getValue("DATABASE_PATH", "./data/db.sqlite3");
    jwt_secret = getValue("JWT_SECRET");
    log_level = getValue("LOG_LEVEL", "info");
    cache_ttl_seconds = std::stoi(getValue("CACHE_TTL_SECONDS", "300"));
    rate_limit_requests = std::stoi(getValue("RATE_LIMIT_REQUESTS", "100"));
    rate_limit_window_seconds = std::stoi(getValue("RATE_LIMIT_WINDOW_SECONDS", "60"));

    if (jwt_secret.empty()) {
        throw std::runtime_error("JWT_SECRET environment variable is not set.");
    }
}
```