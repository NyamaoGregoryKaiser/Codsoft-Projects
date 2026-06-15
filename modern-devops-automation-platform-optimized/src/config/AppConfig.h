```cpp
#pragma once

#include <string>
#include <memory>
#include <json/json.h> // Using Poco::JSON, but standard JsonCpp is fine too
#include <Poco/Util/IniFileConfiguration.h> // Or use Poco::JSON for parsing JSON config

namespace AppConfig {

struct DatabaseConfig {
    std::string host;
    int port;
    std::string user;
    std::string password;
    std::string dbname;
    int connectionPoolSize;
};

struct ServerConfig {
    int port;
    int threads;
    std::string logLevel;
    std::string staticFilesPath;
};

struct JwtConfig {
    std::string secret;
    int expiryMinutes;
};

struct CacheConfig {
    int productTtlSeconds;
    int maxSize;
};

struct RateLimitingConfig {
    bool enabled;
    int maxRequests;
    int windowSeconds;
};


class ConfigManager {
public:
    static ConfigManager& getInstance();

    void loadConfig(const std::string& configFilePath);

    const DatabaseConfig& getDatabaseConfig() const { return dbConfig_; }
    const ServerConfig& getServerConfig() const { return serverConfig_; }
    const JwtConfig& getJwtConfig() const { return jwtConfig_; }
    const CacheConfig& getCacheConfig() const { return cacheConfig_; }
    const RateLimitingConfig& getRateLimitingConfig() const { return rateLimitingConfig_; }

private:
    ConfigManager() = default;
    ConfigManager(const ConfigManager&) = delete;
    ConfigManager& operator=(const ConfigManager&) = delete;

    DatabaseConfig dbConfig_;
    ServerConfig serverConfig_;
    JwtConfig jwtConfig_;
    CacheConfig cacheConfig_;
    RateLimitingConfig rateLimitingConfig_;

    void loadFromJson(const std::string& configFilePath);
    void loadFromEnv();
};

} // namespace AppConfig
```