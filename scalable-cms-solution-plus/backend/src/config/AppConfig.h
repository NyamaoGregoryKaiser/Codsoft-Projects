#pragma once

#include <string>
#include <json/json.h> // Ensure you have jsoncpp in your project or use drogon's internal json
#include <mutex>
#include <memory>

class AppConfig {
public:
    static void loadConfig(const std::string& filePath, bool overrideExisting = false);
    static std::string getString(const std::string& key, const std::string& defaultValue = "");
    static int getInt(const std::string& key, int defaultValue = 0);
    static bool getBool(const std::string& key, bool defaultValue = false);
    static Json::Value getJson(const std::string& key, const Json::Value& defaultValue = Json::Value());

private:
    static Json::Value root;
    static std::mutex configMutex;
    static bool loaded;

    static Json::Value& findNode(const std::string& key);
    static bool parseFile(const std::string& filePath, Json::Value& outRoot);

    AppConfig() = delete; // Private constructor to prevent instantiation
    ~AppConfig() = delete;
    AppConfig(const AppConfig&) = delete;
    AppConfig& operator=(const AppConfig&) = delete;
};
```