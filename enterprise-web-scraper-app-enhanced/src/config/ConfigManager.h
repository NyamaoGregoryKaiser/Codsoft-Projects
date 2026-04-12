```cpp
#ifndef CONFIG_MANAGER_H
#define CONFIG_MANAGER_H

#include <string>
#include <map>
#include <stdexcept>
#include <fstream>
#include <sstream>
#include <algorithm>
#include "../utils/Logger.h"

namespace Scraper {
namespace Config {

class ConfigManager {
public:
    static ConfigManager& getInstance() {
        static ConfigManager instance;
        return instance;
    }

    void loadConfig(const std::string& env_file_path = "config/.env") {
        std::ifstream file(env_file_path);
        if (!file.is_open()) {
            Scraper::Utils::Logger::get_logger()->error("Could not open .env file: {}", env_file_path);
            throw std::runtime_error("Failed to load configuration file.");
        }

        std::string line;
        while (std::getline(file, line)) {
            // Trim whitespace
            line.erase(0, line.find_first_not_of(" \t\n\r\f\v"));
            line.erase(line.find_last_not_of(" \t\n\r\f\v") + 1);

            if (line.empty() || line[0] == '#') {
                continue; // Skip empty lines and comments
            }

            size_t delimiter_pos = line.find('=');
            if (delimiter_pos != std::string::npos) {
                std::string key = line.substr(0, delimiter_pos);
                std::string value = line.substr(delimiter_pos + 1);

                // Trim whitespace from key and value
                key.erase(0, key.find_first_not_of(" \t\n\r\f\v"));
                key.erase(key.find_last_not_of(" \t\n\r\f\v") + 1);
                value.erase(0, value.find_first_not_of(" \t\n\r\f\v"));
                value.erase(value.find_last_not_of(" \t\n\r\f\v") + 1);

                config_map[key] = value;
                Scraper::Utils::Logger::get_logger()->debug("Loaded config: {}={}", key, value);
            }
        }
        Scraper::Utils::Logger::get_logger()->info("Configuration loaded successfully from {}", env_file_path);
    }

    std::string getString(const std::string& key, const std::string& default_value = "") const {
        auto it = config_map.find(key);
        if (it != config_map.end()) {
            return it->second;
        }
        Scraper::Utils::Logger::get_logger()->warn("Config key '{}' not found, using default value '{}'.", key, default_value);
        return default_value;
    }

    int getInt(const std::string& key, int default_value = 0) const {
        auto it = config_map.find(key);
        if (it != config_map.end()) {
            try {
                return std::stoi(it->second);
            } catch (const std::exception& e) {
                Scraper::Utils::Logger::get_logger()->error("Config key '{}' has invalid integer value '{}': {}", key, it->second, e.what());
                return default_value;
            }
        }
        Scraper::Utils::Logger::get_logger()->warn("Config key '{}' not found, using default integer value '{}'.", key, default_value);
        return default_value;
    }

    bool getBool(const std::string& key, bool default_value = false) const {
        auto it = config_map.find(key);
        if (it != config_map.end()) {
            std::string lower_value = it->second;
            std::transform(lower_value.begin(), lower_value.end(), lower_value.begin(), ::tolower);
            return (lower_value == "true" || lower_value == "1");
        }
        Scraper::Utils::Logger::get_logger()->warn("Config key '{}' not found, using default boolean value '{}'.", key, default_value);
        return default_value;
    }

private:
    ConfigManager() = default; // Private constructor for Singleton
    ConfigManager(const ConfigManager&) = delete; // Delete copy constructor
    ConfigManager& operator=(const ConfigManager&) = delete; // Delete assignment operator

    std::map<std::string, std::string> config_map;
};

} // namespace Config
} // namespace Scraper

#endif // CONFIG_MANAGER_H
```