```cpp
#include "Config.h"
#include "Logger.h"
#include <fstream>
#include <sstream>

std::map<std::string, std::string> Config::settings;
bool Config::loaded = false;

void Config::load(const std::string& filename) {
    if (loaded) return;

    std::ifstream file(filename);
    if (!file.is_open()) {
        Logger::get_logger()->warn("Config file {} not found. Falling back to environment variables or defaults.", filename);
        // Attempt to load from environment variables directly if file not found
        settings["DB_HOST"] = std::getenv("DB_HOST") ? std::getenv("DB_HOST") : "localhost";
        settings["DB_PORT"] = std::getenv("DB_PORT") ? std::getenv("DB_PORT") : "5432";
        settings["DB_NAME"] = std::getenv("DB_NAME") ? std::getenv("DB_NAME") : "perfo_metrics_db";
        settings["DB_USER"] = std::getenv("DB_USER") ? std::getenv("DB_USER") : "perfo_user";
        settings["DB_PASSWORD"] = std::getenv("DB_PASSWORD") ? std::getenv("DB_PASSWORD") : "perfo_password";
        settings["JWT_SECRET"] = std::getenv("JWT_SECRET") ? std::getenv("JWT_SECRET") : "supersecretjwtkeyforperfometrics";
        settings["SERVER_PORT"] = std::getenv("SERVER_PORT") ? std::getenv("SERVER_PORT") : "8080";
        settings["RATE_LIMIT_MAX_REQUESTS"] = std::getenv("RATE_LIMIT_MAX_REQUESTS") ? std::getenv("RATE_LIMIT_MAX_REQUESTS") : "100";
        settings["RATE_LIMIT_WINDOW_SECONDS"] = std::getenv("RATE_LIMIT_WINDOW_SECONDS") ? std::getenv("RATE_LIMIT_WINDOW_SECONDS") : "60";
        loaded = true;
        Logger::get_logger()->info("Config loaded from environment variables or defaults.");
        return;
    }

    std::string line;
    while (std::getline(file, line)) {
        if (line.empty() || line[0] == '#') {
            continue;
        }
        size_t delimiter_pos = line.find('=');
        if (delimiter_pos != std::string::npos) {
            std::string key = line.substr(0, delimiter_pos);
            std::string value = line.substr(delimiter_pos + 1);
            settings[key] = value;
        }
    }
    loaded = true;
    Logger::get_logger()->info("Config loaded from file: {}", filename);
}

std::string Config::get(const std::string& key) {
    if (!loaded) {
        load(); // Load if not already loaded
    }
    auto it = settings.find(key);
    if (it != settings.end()) {
        return it->second;
    }
    // Fallback to environment variable if not in .env file
    const char* env_val = std::getenv(key.c_str());
    if (env_val) {
        settings[key] = env_val; // Cache it
        return env_val;
    }
    Logger::get_logger()->error("Config key '{}' not found in .env or environment variables.", key);
    throw std::runtime_error("Config key not found: " + key);
}

int Config::get_int(const std::string& key) {
    return std::stoi(get(key));
}
```