#ifndef ML_UTILITIES_SYSTEM_CONFIG_HPP
#define ML_UTILITIES_SYSTEM_CONFIG_HPP

#include <string>
#include <map>
#include <fstream>
#include <sstream>
#include <stdexcept>
#include <cstdlib> // For getenv
#include "../utils/logger.hpp" // For logging

/**
 * @brief Manages application configuration loaded from environment variables.
 *
 * This class provides a centralized way to access configuration settings,
 * prioritizing environment variables.
 */
class Config {
private:
    static std::map<std::string, std::string> config_values;
    static bool loaded;

    Config() = delete; // Prevent instantiation

public:
    /**
     * @brief Loads configuration values from environment variables.
     * @return True if configuration was loaded successfully, false otherwise.
     */
    static bool loadFromEnv() {
        if (loaded) {
            LOG_WARN("Config already loaded. Skipping re-load.");
            return true;
        }

        // List of expected environment variables.
        // In a real system, you might read from a file first, then override with env vars.
        // For simplicity, we directly read from env.
        const std::vector<std::string> env_vars = {
            "APP_HOST", "APP_PORT", "APP_WORKERS",
            "DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD", "DB_POOL_SIZE",
            "JWT_SECRET", "JWT_EXPIRATION_HOURS",
            "LOG_LEVEL", "LOG_FILE_PATH",
            "CACHE_TTL_SECONDS",
            "RATE_LIMIT_ENABLED", "RATE_LIMIT_MAX_REQUESTS", "RATE_LIMIT_WINDOW_SECONDS"
        };

        for (const auto& var_name : env_vars) {
            const char* value = std::getenv(var_name.c_str());
            if (value) {
                config_values[var_name] = value;
            } else {
                LOG_WARN("Environment variable '{}' not set. Using default or leaving empty.", var_name);
                // For critical variables, you might want to return false here
                // e.g., if (var_name == "JWT_SECRET") return false;
            }
        }
        loaded = true;
        return true;
    }

    /**
     * @brief Retrieves a configuration value by its key.
     * @param key The name of the configuration variable.
     * @param default_value A default value to return if the key is not found.
     * @return The configuration value as a string.
     * @throws std::runtime_error if the key is not found and no default_value is provided.
     */
    static std::string get(const std::string& key, const std::string& default_value = "") {
        if (!loaded) {
            LOG_ERROR("Config not loaded. Call loadFromEnv() first.");
            // Attempt to load once if not loaded
            if (!loadFromEnv()) {
                 throw std::runtime_error("Config not loaded and failed to load on demand.");
            }
        }

        auto it = config_values.find(key);
        if (it != config_values.end()) {
            return it->second;
        }
        if (!default_value.empty()) {
            LOG_DEBUG("Config key '{}' not found, using default value: '{}'", key, default_value);
            return default_value;
        }
        LOG_ERROR("Config key '{}' not found and no default value provided.", key);
        throw std::runtime_error("Configuration key not found: " + key);
    }
};

// Static members initialization
std::map<std::string, std::string> Config::config_values;
bool Config::loaded = false;

#endif // ML_UTILITIES_SYSTEM_CONFIG_HPP
```