```cpp
#pragma once

#include <string>
#include <memory>
#include <nlohmann/json.hpp>

namespace utils
{
    /**
     * @brief Singleton class for managing application configuration.
     * Loads configuration from default.json and environment-specific files,
     * and overrides with environment variables.
     */
    class AppConfig
    {
    public:
        // Delete copy constructor and assignment operator for Singleton pattern
        AppConfig(const AppConfig &) = delete;
        AppConfig &operator=(const AppConfig &) = delete;

        /**
         * @brief Get the singleton instance of AppConfig.
         * @return Reference to the AppConfig instance.
         */
        static AppConfig &getInstance();

        /**
         * @brief Get a string value from the configuration.
         * @param key The dot-separated path to the configuration key (e.g., "database.host").
         * @param defaultValue The default value if the key is not found.
         * @return The string value.
         */
        std::string getString(const std::string &key, const std::string &defaultValue = "") const;

        /**
         * @brief Get an integer value from the configuration.
         * @param key The dot-separated path to the configuration key.
         * @param defaultValue The default value if the key is not found.
         * @return The integer value.
         */
        int getInt(const std::string &key, int defaultValue = 0) const;

        /**
         * @brief Get a boolean value from the configuration.
         * @param key The dot-separated path to the configuration key.
         * @param defaultValue The default value if the key is not found.
         * @return The boolean value.
         */
        bool getBool(const std::string &key, bool defaultValue = false) const;

        /**
         * @brief Get a JSON object from the configuration.
         * @param key The dot-separated path to the configuration key.
         * @return The nlohmann::json object.
         */
        nlohmann::json getJson(const std::string &key) const;

        /**
         * @brief Get the full configuration JSON object.
         * @return The full configuration JSON object.
         */
        const nlohmann::json &getFullConfig() const;

    private:
        AppConfig(); // Private constructor for Singleton
        nlohmann::json config_;

        /**
         * @brief Loads configuration from a JSON file.
         * @param filePath The path to the JSON file.
         * @return The parsed JSON object.
         */
        nlohmann::json loadJsonFile(const std::string &filePath) const;

        /**
         * @brief Merges a source JSON object into a target JSON object.
         * @param target The target JSON object to merge into.
         * @param source The source JSON object to merge from.
         */
        void mergeJson(nlohmann::json &target, const nlohmann::json &source) const;

        /**
         * @brief Overrides configuration values with environment variables.
         * @param config The JSON configuration object to modify.
         */
        void overrideWithEnvVars(nlohmann::json &config);

        /**
         * @brief Helper to get a value from JSON using a dot-separated key.
         */
        nlohmann::json getNestedValue(const nlohmann::json &json, const std::string &key) const;
    };

} // namespace utils
```