#ifndef AUTH_SYSTEM_CONFIG_H
#define AUTH_SYSTEM_CONFIG_H

#include <string>
#include <stdexcept>

// Custom exception for configuration errors
class ConfigError : public std::runtime_error {
public:
    explicit ConfigError(const std::string& message) : std::runtime_error(message) {}
};

class Config {
public:
    static void load(const std::string& envFile = ".env.backend");

    static std::string getDbHost();
    static std::string getDbPort();
    static std::string getDbUser();
    static std::string getDbPassword();
    static std::string getDbName();

    static std::string getJwtSecret();
    static std::string getJwtRefreshSecret();
    static long getJwtAccessExpirationMinutes();
    static long getJwtRefreshExpirationMinutes();

    static int getHttpPort();
    static int getRateLimitMaxRequests();
    static int getRateLimitWindowSeconds();

private:
    static bool isLoaded;
    static std::string dbHost;
    static std::string dbPort;
    static std::string dbUser;
    static std::string dbPassword;
    static std::string dbName;

    static std::string jwtSecret;
    static std::string jwtRefreshSecret;
    static long jwtAccessExpirationMinutes;
    static long jwtRefreshExpirationMinutes;

    static int httpPort;
    static int rateLimitMaxRequests;
    static int rateLimitWindowSeconds;

    static std::string getEnvVar(const std::string& name);
    static int getEnvVarAsInt(const std::string& name);
    static long getEnvVarAsLong(const std::string& name);
};

#endif // AUTH_SYSTEM_CONFIG_H