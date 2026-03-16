```cpp
#include "Config.h"
#include "Logger.h"
#include <fstream>
#include <stdexcept>

nlohmann::json Config::settings;

void Config::load(const std::string& filepath) {
    std::ifstream file(filepath);
    if (!file.is_open()) {
        Logger::error("Config file not found: {}", filepath);
        throw std::runtime_error("Config file not found: " + filepath);
    }

    try {
        file >> settings;
        Logger::info("Configuration loaded from {}", filepath);
    } catch (const nlohmann::json::parse_error& e) {
        Logger::critical("Failed to parse config file {}: {}", filepath, e.what());
        throw std::runtime_error("Failed to parse config file: " + std::string(e.what()));
    }
}

std::string Config::get(const std::string& key, const std::string& default_value) {
    if (settings.contains(key)) {
        return settings.at(key).get<std::string>();
    }
    // Check environment variable if not in JSON
    const char* env_var = std::getenv(key.c_str());
    if (env_var) {
        return env_var;
    }
    Logger::warn("Config key '{}' not found, using default value: '{}'", key, default_value);
    return default_value;
}

int Config::getInt(const std::string& key, int default_value) {
    if (settings.contains(key)) {
        return settings.at(key).get<int>();
    }
    const char* env_var = std::getenv(key.c_str());
    if (env_var) {
        try {
            return std::stoi(env_var);
        } catch (const std::exception& e) {
            Logger::warn("Environment variable for key '{}' is not an integer, using default value: {}", key, default_value);
        }
    }
    Logger::warn("Config key '{}' not found, using default int value: {}", key, default_value);
    return default_value;
}

bool Config::getBool(const std::string& key, bool default_value) {
    if (settings.contains(key)) {
        return settings.at(key).get<bool>();
    }
    const char* env_var = std::getenv(key.c_str());
    if (env_var) {
        std::string s_env_var = env_var;
        return (s_env_var == "true" || s_env_var == "1");
    }
    Logger::warn("Config key '{}' not found, using default bool value: {}", key, default_value);
    return default_value;
}

nlohmann::json Config::getObject(const std::string& key) {
    if (settings.contains(key) && settings.at(key).is_object()) {
        return settings.at(key);
    }
    Logger::warn("Config key '{}' not found or not an object, returning empty object.", key);
    return nlohmann::json::object();
}
```