#pragma once

#include <string>
#include <stdexcept>
#include <map>

// Simple .env parser (for demonstration)
namespace EnvParser {
    std::map<std::string, std::string> parseEnvFile(const std::string& filepath);
    std::string getEnvVar(const std::string& name, const std::string& default_value = "");
}

class AppConfig {
private:
    AppConfig() = default; // Private constructor for Singleton

    std::string app_env;
    int port;
    std::string database_path;
    std::string jwt_secret;
    std::string log_level;
    int cache_ttl_seconds;
    int rate_limit_requests;
    int rate_limit_window_seconds;

public:
    static AppConfig& getInstance(); // Singleton accessor

    // Delete copy constructor and assignment operator
    AppConfig(const AppConfig&) = delete;
    AppConfig& operator=(const AppConfig&) = delete;

    void loadFromEnv(); // Load configuration from environment variables

    // Getters
    const std::string& getAppEnv() const { return app_env; }
    int getPort() const { return port; }
    const std::string& getDatabasePath() const { return database_path; }
    const std::string& getJwtSecret() const { return jwt_secret; }
    const std::string& getLogLevel() const { return log_level; }
    int getCacheTtlSeconds() const { return cache_ttl_seconds; }
    int getRateLimitRequests() const { return rate_limit_requests; }
    int getRateLimitWindowSeconds() const { return rate_limit_window_seconds; }
};
```