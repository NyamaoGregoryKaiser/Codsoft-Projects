```cpp
#include "AppConfig.h"
#include "Logger.h"
#include <fstream>
#include <iostream>
#include <cstdlib> // For getenv
#include <sstream> // For parsing integers/booleans from env

namespace utils
{
    AppConfig::AppConfig()
    {
        // 1. Load default configuration
        std::string defaultPath = "config/default.json";
        config_ = loadJsonFile(defaultPath);

        // 2. Load environment-specific configuration if APP_ENV is set
        const char *env = std::getenv("APP_ENV");
        if (env)
        {
            std::string envStr = env;
            std::string envConfigPath = "config/environments/" + envStr + ".json";
            nlohmann::json envConfig = loadJsonFile(envConfigPath);
            if (!envConfig.empty())
            {
                mergeJson(config_, envConfig);
                LOG_INFO("Loaded environment-specific configuration from: {}", envConfigPath);
            }
            else
            {
                LOG_WARN("APP_ENV is set to '{}' but no specific config file found at '{}'", envStr, envConfigPath);
            }
        }
        else
        {
            LOG_INFO("APP_ENV not set, using default configuration only.");
        }

        // 3. Override with explicit environment variables
        overrideWithEnvVars(config_);

        LOG_INFO("AppConfig initialized.");
        LOG_DEBUG("Full configuration: {}", config_.dump(2));
    }

    AppConfig &AppConfig::getInstance()
    {
        static AppConfig instance;
        return instance;
    }

    nlohmann::json AppConfig::loadJsonFile(const std::string &filePath) const
    {
        std::ifstream file(filePath);
        if (!file.is_open())
        {
            LOG_WARN("Configuration file not found: {}", filePath);
            return nlohmann::json();
        }
        try
        {
            nlohmann::json json;
            file >> json;
            return json;
        }
        catch (const nlohmann::json::parse_error &e)
        {
            LOG_ERROR("Failed to parse JSON file {}: {}", filePath, e.what());
            return nlohmann::json();
        }
    }

    void AppConfig::mergeJson(nlohmann::json &target, const nlohmann::json &source) const
    {
        for (auto it = source.begin(); it != source.end(); ++it)
        {
            if (it.value().is_object())
            {
                if (target.contains(it.key()) && target[it.key()].is_object())
                {
                    mergeJson(target[it.key()], it.value());
                }
                else
                {
                    target[it.key()] = it.value();
                }
            }
            else
            {
                target[it.key()] = it.value();
            }
        }
    }

    void AppConfig::overrideWithEnvVars(nlohmann::json &config)
    {
        // Example mappings for environment variables to JSON paths
        // This is a manual mapping, more complex parsing could be done.
        std::vector<std::pair<std::string, std::string>> envMap = {
            {"DB_HOST", "database.host"},
            {"DB_PORT", "database.port"},
            {"DB_NAME", "database.name"},
            {"DB_USER", "database.user"},
            {"DB_PASSWORD", "database.password"},
            {"APP_PORT", "app.port"},
            {"JWT_SECRET", "jwt.secret"},
            {"LOG_LEVEL", "app.logLevel"},
            {"CACHE_TTL_SECONDS", "cache.ttlSeconds"},
            {"RATE_LIMIT_ENABLED", "rateLimit.enabled"},
            {"RATE_LIMIT_BUCKET_CAPACITY", "rateLimit.bucketCapacity"},
            {"RATE_LIMIT_BUCKET_REFILL_RATE", "rateLimit.bucketRefillRatePerSecond"}
        };

        for (const auto &pair : envMap)
        {
            const char *envValue = std::getenv(pair.first.c_str());
            if (envValue)
            {
                std::string path = pair.second;
                nlohmann::json *current = &config;
                std::stringstream ss(path);
                std::string segment;

                while (std::getline(ss, segment, '.'))
                {
                    if (!current->contains(segment))
                    {
                        (*current)[segment] = nlohmann::json::object(); // Create intermediate object
                    }
                    current = &(*current)[segment];
                }

                // Determine type and assign
                if (current->is_number_integer() || current->is_number_unsigned())
                {
                    try { (*current) = std::stoi(envValue); }
                    catch (...) { LOG_WARN("Environment variable {} value '{}' is not a valid integer, skipping override.", pair.first, envValue); }
                }
                else if (current->is_boolean())
                {
                    std::string lowerEnvValue = envValue;
                    std::transform(lowerEnvValue.begin(), lowerEnvValue.end(), lowerEnvValue.begin(), ::tolower);
                    if (lowerEnvValue == "true" || lowerEnvValue == "1") { (*current) = true; }
                    else if (lowerEnvValue == "false" || lowerEnvValue == "0") { (*current) = false; }
                    else { LOG_WARN("Environment variable {} value '{}' is not a valid boolean, skipping override.", pair.first, envValue); }
                }
                else
                {
                    // Default to string for others
                    (*current) = envValue;
                }
                LOG_DEBUG("Overrode config key '{}' with environment variable '{}' = '{}'", path, pair.first, envValue);
            }
        }
    }

    nlohmann::json AppConfig::getNestedValue(const nlohmann::json &json, const std::string &key) const
    {
        std::stringstream ss(key);
        std::string segment;
        const nlohmann::json *current = &json;

        while (std::getline(ss, segment, '.'))
        {
            if (current->contains(segment))
            {
                current = &(*current)[segment];
            }
            else
            {
                return nlohmann::json(); // Not found
            }
        }
        return *current;
    }

    std::string AppConfig::getString(const std::string &key, const std::string &defaultValue) const
    {
        nlohmann::json value = getNestedValue(config_, key);
        if (value.is_string())
        {
            return value.get<std::string>();
        }
        LOG_WARN("Config key '{}' not found or not a string, returning default: '{}'", key, defaultValue);
        return defaultValue;
    }

    int AppConfig::getInt(const std::string &key, int defaultValue) const
    {
        nlohmann::json value = getNestedValue(config_, key);
        if (value.is_number_integer())
        {
            return value.get<int>();
        }
        LOG_WARN("Config key '{}' not found or not an integer, returning default: {}", key, defaultValue);
        return defaultValue;
    }

    bool AppConfig::getBool(const std::string &key, bool defaultValue) const
    {
        nlohmann::json value = getNestedValue(config_, key);
        if (value.is_boolean())
        {
            return value.get<bool>();
        }
        LOG_WARN("Config key '{}' not found or not a boolean, returning default: {}", key, defaultValue);
        return defaultValue;
    }

    nlohmann::json AppConfig::getJson(const std::string &key) const
    {
        return getNestedValue(config_, key);
    }

    const nlohmann::json &AppConfig::getFullConfig() const
    {
        return config_;
    }

} // namespace utils
```