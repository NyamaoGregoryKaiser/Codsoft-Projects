```cpp
#include "ConfigManager.h"
#include "../utils/Logger.h"
#include <fstream>
#include <sstream>
#include <algorithm> // For std::transform, std::tolower

// Static member initialization
ConfigManager& ConfigManager::getInstance() {
    static ConfigManager instance; // Guaranteed to be destroyed, instantiated on first use.
    return instance;
}

bool ConfigManager::loadEnv(const std::string& filePath) {
    std::lock_guard<std::mutex> lock(mtx); // Protect concurrent access to envVars

    std::ifstream file(filePath);
    if (!file.is_open()) {
        LOG_ERROR("Failed to open .env file: {}. Falling back to defaults/drogon_config.json.", filePath);
        return false;
    }

    std::string line;
    while (std::getline(file, line)) {
        // Trim whitespace from the line
        line.erase(0, line.find_first_not_of(" \t\r\n"));
        line.erase(line.find_last_not_of(" \t\r\n") + 1);

        // Skip comments and empty lines
        if (line.empty() || line[0] == '#') {
            continue;
        }

        size_t equalsPos = line.find('=');
        if (equalsPos != std::string::npos) {
            std::string key = line.substr(0, equalsPos);
            std::string value = line.substr(equalsPos + 1);

            // Trim whitespace from key and value
            key.erase(0, key.find_first_not_of(" \t\r\n"));
            key.erase(key.find_last_not_of(" \t\r\n") + 1);
            value.erase(0, value.find_first_not_of(" \t\r\n"));
            value.erase(value.find_last_not_of(" \t\r\n") + 1);

            // Handle quoted values (simple double quotes for now)
            if (value.length() >= 2 && value.front() == '"' && value.back() == '"') {
                value = value.substr(1, value.length() - 2);
            }

            envVars[key] = value;
            LOG_DEBUG("Loaded env var: {}={}", key, value);
        }
    }
    LOG_INFO(".env file loaded successfully: {}", filePath);
    return true;
}

std::string ConfigManager::getString(const std::string& key, const std::string& defaultValue) {
    std::lock_guard<std::mutex> lock(mtx);
    if (envVars.count(key)) {
        return envVars[key];
    }
    return defaultValue;
}

int ConfigManager::getInt(const std::string& key, int defaultValue) {
    std::lock_guard<std::mutex> lock(mtx);
    if (envVars.count(key)) {
        try {
            return std::stoi(envVars[key]);
        } catch (const std::exception& e) {
            LOG_ERROR("Error converting env var '{}' to int: {}. Using default value {}.", key, e.what(), defaultValue);
        }
    }
    return defaultValue;
}

bool ConfigManager::getBool(const std::string& key, bool defaultValue) {
    std::lock_guard<std::mutex> lock(mtx);
    if (envVars.count(key)) {
        std::string value = envVars[key];
        std::transform(value.begin(), value.end(), value.begin(), ::tolower);
        if (value == "true" || value == "1") {
            return true;
        } else if (value == "false" || value == "0") {
            return false;
        } else {
            LOG_WARN("Env var '{}' has unrecognized boolean value '{}'. Using default value {}.", key, value, defaultValue);
        }
    }
    return defaultValue;
}
```