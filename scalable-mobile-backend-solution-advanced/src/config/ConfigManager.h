```cpp
#pragma once

#include <string>
#include <unordered_map>
#include <mutex>
#include <optional>

/**
 * @brief Manages environment configurations loaded from an .env file.
 *
 * This class provides a singleton pattern to ensure only one instance of
 * the configuration manager exists, centralizing access to environment variables.
 */
class ConfigManager {
public:
    /**
     * @brief Get the singleton instance of ConfigManager.
     * @return Reference to the ConfigManager instance.
     */
    static ConfigManager& getInstance();

    /**
     * @brief Loads environment variables from the specified .env file.
     * @param filePath Path to the .env file.
     * @return True if the file was loaded successfully, false otherwise.
     */
    bool loadEnv(const std::string& filePath);

    /**
     * @brief Get a string value from the configuration.
     * @param key The key of the configuration variable.
     * @param defaultValue A default value to return if the key is not found.
     * @return The string value associated with the key, or defaultValue if not found.
     */
    std::string getString(const std::string& key, const std::string& defaultValue = "");

    /**
     * @brief Get an integer value from the configuration.
     * @param key The key of the configuration variable.
     * @param defaultValue A default value to return if the key is not found or cannot be converted.
     * @return The integer value associated with the key, or defaultValue.
     */
    int getInt(const std::string& key, int defaultValue = 0);

    /**
     * @brief Get a boolean value from the configuration.
     * @param key The key of the configuration variable.
     * @param defaultValue A default value to return if the key is not found or cannot be converted.
     * @return The boolean value associated with the key, or defaultValue.
     *         Recognizes "true", "True", "TRUE", "1" as true, and others as false.
     */
    bool getBool(const std::string& key, bool defaultValue = false);

    // Delete copy constructor and assignment operator to enforce singleton pattern
    ConfigManager(const ConfigManager&) = delete;
    ConfigManager& operator=(const ConfigManager&) = delete;

private:
    // Private constructor for singleton
    ConfigManager() = default;

    std::unordered_map<std::string, std::string> envVars;
    std::mutex mtx; // Mutex to protect access to envVars during initialization
};
```