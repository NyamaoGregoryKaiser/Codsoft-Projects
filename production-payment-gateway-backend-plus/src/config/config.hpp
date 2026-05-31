```cpp
#ifndef ZENITH_CONFIG_HPP
#define ZENITH_CONFIG_HPP

#include <string>
#include <map>

namespace Zenith {
namespace Config {

class AppConfig {
public:
    static AppConfig& getInstance();

    // Database
    const std::string& getDbHost() const { return getEnv("DB_HOST", "localhost"); }
    const std::string& getDbPort() const { return getEnv("DB_PORT", "5432"); }
    const std::string& getDbUser() const { return getEnv("DB_USER", "zenith_user"); }
    const std::string& getDbPassword() const { return getEnv("DB_PASSWORD", "password"); }
    const std::string& getDbName() const { return getEnv("DB_NAME", "zenith_db"); }

    // Server
    const std::string& getServerHost() const { return getEnv("SERVER_HOST", "0.0.0.0"); }
    int getServerPort() const { return std::stoi(getEnv("SERVER_PORT", "8080")); }

    // JWT
    const std::string& getJwtSecret() const { return getEnv("JWT_SECRET", "super_secret_jwt_key_please_change_this_in_production"); }
    long getJwtExpirationSeconds() const { return std::stol(getEnv("JWT_EXPIRATION_SECONDS", "3600")); } // 1 hour

    // Caching
    const std::string& getRedisHost() const { return getEnv("REDIS_HOST", "localhost"); }
    int getRedisPort() const { return std::stoi(getEnv("REDIS_PORT", "6379")); }

    // Payment Gateway (Mock for now)
    const std::string& getPaymentGatewayApiUrl() const { return getEnv("PAYMENT_GATEWAY_API_URL", "http://mock-gateway.com/api"); }
    const std::string& getPaymentGatewayApiKey() const { return getEnv("PAYMENT_GATEWAY_API_KEY", "mock_api_key_123"); }

    // Logging
    const std::string& getLogLevel() const { return getEnv("LOG_LEVEL", "info"); } // debug, info, warn, error, critical

    // Rate Limiting
    int getMaxRequestsPerMinute() const { return std::stoi(getEnv("RATE_LIMIT_MAX_REQUESTS", "100")); }
    int getRateLimitWindowSeconds() const { return std::stoi(getEnv("RATE_LIMIT_WINDOW_SECONDS", "60")); }

private:
    AppConfig();
    AppConfig(const AppConfig&) = delete;
    AppConfig& operator=(const AppConfig&) = delete;

    std::string getEnv(const std::string& key, const std::string& default_value) const;
};

} // namespace Config
} // namespace Zenith

#endif // ZENITH_CONFIG_HPP
```