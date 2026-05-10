```cpp
#include "Config.h"
#include "../utils/Logger.h" // For logging config loading errors
#include <fstream>
#include <sstream>
#include <stdexcept>
#include <algorithm> // For std::transform

std::map<std::string, std::string> Config::configMap;
bool Config::loaded = false;

void Config::loadConfig(const std::string& filename) {
    if (loaded) {
        // LOG_WARN("Config already loaded. Skipping reload.");
        return;
    }

    std::ifstream file(filename);
    if (!file.is_open()) {
        // Try to load from default location if not found at filename
        std::string fallback_filename = "./.env";
        file.open(fallback_filename);
        if (!file.is_open()) {
            LOG_WARN("Could not open config file: %s or %s. Using default values.", filename.c_str(), fallback_filename.c_str());
            // It's crucial not to exit here, as default values might be sufficient for some cases,
            // or environment variables might override missing .env entries.
            loaded = true;
            return;
        } else {
            LOG_INFO("Using fallback config file: %s", fallback_filename.c_str());
        }
    }

    std::string line;
    while (std::getline(file, line)) {
        // Remove comments
        size_t commentPos = line.find('#');
        if (commentPos != std::string::npos) {
            line = line.substr(0, commentPos);
        }

        // Trim whitespace
        line.erase(0, line.find_first_not_of(" \t\r\n"));
        line.erase(line.find_last_not_of(" \t\r\n") + 1);

        if (line.empty()) {
            continue;
        }

        size_t equalsPos = line.find('=');
        if (equalsPos != std::string::npos) {
            std::string key = line.substr(0, equalsPos);
            std::string value = line.substr(equalsPos + 1);

            key.erase(0, key.find_first_not_of(" \t\r\n"));
            key.erase(key.find_last_not_of(" \t\r\n") + 1);
            value.erase(0, value.find_first_not_of(" \t\r\n"));
            value.erase(value.find_last_not_of(" \t\r\n") + 1);

            // Handle quoted values
            if (value.length() >= 2 && value.front() == '"' && value.back() == '"') {
                value = value.substr(1, value.length() - 2);
            }

            configMap[key] = value;
        }
    }
    file.close();
    loaded = true;
    LOG_INFO("Config loaded from %s.", filename.c_str());

    // Additionally, load from environment variables, which should override .env file
    // This is crucial for Docker deployments where .env might not be present or overrides are needed.
    for (auto const& [key, val] : configMap) {
        const char* env_val = std::getenv(key.c_str());
        if (env_val) {
            configMap[key] = env_val;
            LOG_DEBUG("Environment variable override: %s = %s", key.c_str(), env_val);
        }
    }
}

std::string Config::get(const std::string& key, const std::string& defaultValue) {
    if (configMap.count(key)) {
        return configMap[key];
    }
    // Check environment variables directly as a last resort, even if not in .env file
    const char* env_val = std::getenv(key.c_str());
    if (env_val) {
        configMap[key] = env_val; // Cache it for future calls
        return env_val;
    }
    LOG_DEBUG("Config key '%s' not found. Using default value '%s'.", key.c_str(), defaultValue.c_str());
    return defaultValue;
}

int Config::getInt(const std::string& key, int defaultValue) {
    try {
        std::string val = get(key);
        if (!val.empty()) {
            return std::stoi(val);
        }
    } catch (const std::exception& e) {
        LOG_ERROR("Invalid integer value for config key '%s': %s. Using default %d.", key.c_str(), e.what(), defaultValue);
    }
    return defaultValue;
}

bool Config::getBool(const std::string& key, bool defaultValue) {
    std::string val = get(key);
    std::transform(val.begin(), val.end(), val.begin(), ::tolower);
    if (val == "true" || val == "1" || val == "yes") {
        return true;
    }
    if (val == "false" || val == "0" || val == "no") {
        return false;
    }
    LOG_DEBUG("Invalid boolean value for config key '%s'. Using default %s.", key.c_str(), (defaultValue ? "true" : "false"));
    return defaultValue;
}

int Config::getAppPort() {
    return getInt("APP_PORT", 8080);
}

std::string Config::getAppEnv() {
    return get("APP_ENV", "development");
}

std::string Config::getDatabasePath() {
    return get("DATABASE_PATH", "./data/auth_system.db");
}

std::string Config::getJwtSecret() {
    std::string secret = get("JWT_SECRET");
    if (secret.empty() || secret == "supersecretjwtkeythatshouldbemorethan256bitlongandrandomlygeneratedinproduction") {
        LOG_FATAL("JWT_SECRET is not configured or is using default insecure value. This is a security risk in production.");
        // In a real application, you might want to terminate or throw here in production env
    }
    return secret;
}

int Config::getJwtAccessTokenExpirationSeconds() {
    return getInt("JWT_ACCESS_TOKEN_EXPIRATION_SECONDS", 3600); // 1 hour
}

int Config::getJwtRefreshTokenExpirationSeconds() {
    return getInt("JWT_REFRESH_TOKEN_EXPIRATION_SECONDS", 2592000); // 30 days
}

LogLevel Config::getLogLevel() {
    return stringToLogLevel(get("LOG_LEVEL", "INFO"));
}

bool Config::isRateLimitingEnabled() {
    return getBool("RATE_LIMIT_ENABLED", false);
}

int Config::getRateLimitRequestsPerMinute() {
    return getInt("RATE_LIMIT_REQUESTS_PER_MINUTE", 60);
}

int Config::getRateLimitWindowSeconds() {
    return getInt("RATE_LIMIT_WINDOW_SECONDS", 60);
}

bool Config::isCachingEnabled() {
    return getBool("CACHING_ENABLED", false);
}

std::string Config::getCacheRedisHost() {
    return get("CACHE_REDIS_HOST", "localhost");
}

int Config::getCacheRedisPort() {
    return getInt("CACHE_REDIS_PORT", 6379);
}

LogLevel Config::stringToLogLevel(const std::string& levelStr) {
    std::string upperLevelStr = levelStr;
    std::transform(upperLevelStr.begin(), upperLevelStr.end(), upperLevelStr.begin(), ::toupper);

    if (upperLevelStr == "DEBUG") return DEBUG;
    if (upperLevelStr == "INFO") return INFO;
    if (upperLevelStr == "WARN") return WARN;
    if (upperLevelStr == "ERROR") return ERROR;
    if (upperLevelStr == "FATAL") return FATAL;
    return INFO; // Default to INFO
}
```