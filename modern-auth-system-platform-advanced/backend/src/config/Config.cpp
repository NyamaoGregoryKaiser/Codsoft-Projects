#include "Config.h"
#include "../logger/Logger.h"
#include <fstream>
#include <sstream>
#include <cstdlib> // For getenv

bool Config::isLoaded = false;
std::string Config::dbHost = "";
std::string Config::dbPort = "";
std::string Config::dbUser = "";
std::string Config::dbPassword = "";
std::string Config::dbName = "";

std::string Config::jwtSecret = "";
std::string Config::jwtRefreshSecret = "";
long Config::jwtAccessExpirationMinutes = 0;
long Config::jwtRefreshExpirationMinutes = 0;

int Config::httpPort = 0;
int Config::rateLimitMaxRequests = 0;
int Config::rateLimitWindowSeconds = 0;

std::string Config::getEnvVar(const std::string& name) {
    char* value = std::getenv(name.c_str());
    if (value == nullptr || std::string(value).empty()) {
        Logger::getLogger()->error("Missing environment variable: {}", name);
        throw ConfigError("Missing environment variable: " + name);
    }
    return std::string(value);
}

int Config::getEnvVarAsInt(const std::string& name) {
    try {
        return std::stoi(getEnvVar(name));
    } catch (const std::exception& e) {
        Logger::getLogger()->error("Invalid integer for environment variable {}: {}", name, e.what());
        throw ConfigError("Invalid integer for environment variable: " + name);
    }
}

long Config::getEnvVarAsLong(const std::string& name) {
    try {
        return std::stol(getEnvVar(name));
    } catch (const std::exception& e) {
        Logger::getLogger()->error("Invalid long for environment variable {}: {}", name, e.what());
        throw ConfigError("Invalid long for environment variable: " + name);
    }
}

void Config::load(const std::string& envFile) {
    if (isLoaded) {
        return; // Already loaded
    }

    // Try to load from .env file first
    std::ifstream file(envFile);
    if (file.is_open()) {
        std::string line;
        while (std::getline(file, line)) {
            if (line.empty() || line[0] == '#') continue; // Skip empty lines and comments

            size_t equalsPos = line.find('=');
            if (equalsPos != std::string::npos) {
                std::string key = line.substr(0, equalsPos);
                std::string value = line.substr(equalsPos + 1);

                // Trim whitespace
                key.erase(0, key.find_first_not_of(" \t\r\n"));
                key.erase(key.find_last_not_of(" \t\r\n") + 1);
                value.erase(0, value.find_first_not_of(" \t\r\n"));
                value.erase(value.find_last_not_of(" \t\r\n") + 1);

                // Set environment variables from file (overrides existing)
                // This makes subsequent getenv calls work
#ifdef _WIN32
                _putenv_s(key.c_str(), value.c_str());
#else
                setenv(key.c_str(), value.c_str(), 1);
#endif
            }
        }
        file.close();
        Logger::getLogger()->info("Loaded environment variables from {}", envFile);
    } else {
        Logger::getLogger()->warn("No .env file found at {}. Relying on system environment variables.", envFile);
    }

    // Now retrieve all variables, which might come from .env or system env.
    try {
        dbHost = getEnvVar("DB_HOST");
        dbPort = getEnvVar("DB_PORT");
        dbUser = getEnvVar("DB_USER");
        dbPassword = getEnvVar("DB_PASSWORD");
        dbName = getEnvVar("DB_NAME");

        jwtSecret = getEnvVar("JWT_SECRET");
        jwtRefreshSecret = getEnvVar("JWT_REFRESH_SECRET");
        jwtAccessExpirationMinutes = getEnvVarAsLong("JWT_ACCESS_TOKEN_EXPIRATION_MINUTES");
        jwtRefreshExpirationMinutes = getEnvVarAsLong("JWT_REFRESH_TOKEN_EXPIRATION_MINUTES");

        httpPort = getEnvVarAsInt("HTTP_PORT");
        rateLimitMaxRequests = getEnvVarAsInt("RATE_LIMIT_MAX_REQUESTS");
        rateLimitWindowSeconds = getEnvVarAsInt("RATE_LIMIT_WINDOW_SECONDS");

        isLoaded = true;
        Logger::getLogger()->info("Configuration loaded successfully.");
    } catch (const ConfigError& e) {
        Logger::getLogger()->critical("Failed to load configuration: {}", e.what());
        throw; // Re-throw to propagate the error
    }
}

std::string Config::getDbHost() { return dbHost; }
std::string Config::getDbPort() { return dbPort; }
std::string Config::getDbUser() { return dbUser; }
std::string Config::getDbPassword() { return dbPassword; }
std::string Config::getDbName() { return dbName; }

std::string Config::getJwtSecret() { return jwtSecret; }
std::string Config::getJwtRefreshSecret() { return jwtRefreshSecret; }
long Config::getJwtAccessExpirationMinutes() { return jwtAccessExpirationMinutes; }
long Config::getJwtRefreshExpirationMinutes() { return jwtRefreshExpirationMinutes; }

int Config::getHttpPort() { return httpPort; }
int Config::getRateLimitMaxRequests() { return rateLimitMaxRequests; }
int Config::getRateLimitWindowSeconds() { return rateLimitWindowSeconds; }