```cpp
#ifndef AUTH_SYSTEM_CONFIG_H
#define AUTH_SYSTEM_CONFIG_H

#include <string>
#include <map>

// Enum for log levels
enum LogLevel {
    DEBUG = 0,
    INFO,
    WARN,
    ERROR,
    FATAL
};

class Config {
public:
    static void loadConfig(const std::string& filename);
    static std::string get(const std::string& key, const std::string& defaultValue = "");
    static int getInt(const std::string& key, int defaultValue = 0);
    static bool getBool(const std::string& key, bool defaultValue = false);

    // Specific getters for common config values
    static int getAppPort();
    static std::string getAppEnv();
    static std::string getDatabasePath();
    static std::string getJwtSecret();
    static int getJwtAccessTokenExpirationSeconds();
    static int getJwtRefreshTokenExpirationSeconds();
    static LogLevel getLogLevel();

    // Conceptual getters for additional features
    static bool isRateLimitingEnabled();
    static int getRateLimitRequestsPerMinute();
    static int getRateLimitWindowSeconds();
    static bool isCachingEnabled();
    static std::string getCacheRedisHost();
    static int getCacheRedisPort();


private:
    static std::map<std::string, std::string> configMap;
    static bool loaded;

    static LogLevel stringToLogLevel(const std::string& levelStr);
};

#endif // AUTH_SYSTEM_CONFIG_H
```