```cpp
#include "AppConfig.h"
#include "../utils/Logger.h"
#include <fstream>
#include <iostream>
#include <Poco/JSON/Parser.h>
#include <Poco/JSON/Object.h>
#include <Poco/Path.h>
#include <Poco/File.h>

namespace AppConfig {

ConfigManager& ConfigManager::getInstance() {
    static ConfigManager instance;
    return instance;
}

void ConfigManager::loadConfig(const std::string& configFilePath) {
    // 1. Load from JSON file
    loadFromJson(configFilePath);

    // 2. Override with Environment Variables (if set)
    loadFromEnv();

    LOG_INFO << "Configuration loaded.";
    LOG_DEBUG << "DB Host: " << dbConfig_.host << ", Port: " << dbConfig_.port
              << ", User: " << dbConfig_.user << ", DBName: " << dbConfig_.dbname
              << ", Pool Size: " << dbConfig_.connectionPoolSize;
    LOG_DEBUG << "Server Port: " << serverConfig_.port
              << ", Threads: " << serverConfig_.threads
              << ", Log Level: " << serverConfig_.logLevel
              << ", Static Files: " << serverConfig_.staticFilesPath;
    LOG_DEBUG << "JWT Secret: [HIDDEN]"
              << ", Expiry: " << jwtConfig_.expiryMinutes << " min";
    LOG_DEBUG << "Cache Product TTL: " << cacheConfig_.productTtlSeconds << "s"
              << ", Max Size: " << cacheConfig_.maxSize;
    LOG_DEBUG << "Rate Limiting Enabled: " << (rateLimitingConfig_.enabled ? "true" : "false")
              << ", Max Requests: " << rateLimitingConfig_.maxRequests
              << ", Window: " << rateLimitingConfig_.windowSeconds << "s";
}

void ConfigManager::loadFromJson(const std::string& configFilePath) {
    Poco::Path path(configFilePath);
    if (!Poco::File(path).exists()) {
        LOG_WARN << "Config file not found: " << configFilePath << ". Using default/env configs.";
        return;
    }

    std::ifstream ifs(configFilePath);
    if (!ifs.is_open()) {
        LOG_ERROR << "Failed to open config file: " << configFilePath;
        return;
    }

    std::string content((std::istreambuf_iterator<char>(ifs)),
                        std::istreambuf_iterator<char>());

    try {
        Poco::JSON::Parser parser;
        Poco::Dynamic::Var result = parser.parse(content);
        Poco::JSON::Object::Ptr root = result.extract<Poco::JSON::Object::Ptr>();

        // Database
        Poco::JSON::Object::Ptr dbObj = root->getObject("database");
        if (dbObj) {
            dbConfig_.host = dbObj->getValue<std::string>("host", "localhost");
            dbConfig_.port = dbObj->getValue<int>("port", 5432);
            dbConfig_.user = dbObj->getValue<std::string>("user", "product_user");
            dbConfig_.password = dbObj->getValue<std::string>("password", "strong_password");
            dbConfig_.dbname = dbObj->getValue<std::string>("dbname", "product_catalog");
            dbConfig_.connectionPoolSize = dbObj->getValue<int>("connection_pool_size", 10);
        }

        // Server
        Poco::JSON::Object::Ptr serverObj = root->getObject("server");
        if (serverObj) {
            serverConfig_.port = serverObj->getValue<int>("port", 8080);
            serverConfig_.threads = serverObj->getValue<int>("threads", 4);
            serverConfig_.logLevel = serverObj->getValue<std::string>("log_level", "DEBUG");
            serverConfig_.staticFilesPath = serverObj->getValue<std::string>("static_files_path", "./web");
        }

        // JWT
        Poco::JSON::Object::Ptr jwtObj = root->getObject("jwt");
        if (jwtObj) {
            jwtConfig_.secret = jwtObj->getValue<std::string>("secret", "superSecretKeyForProductCatalogService");
            jwtConfig_.expiryMinutes = jwtObj->getValue<int>("expiry_minutes", 60);
        }

        // Cache
        Poco::JSON::Object::Ptr cacheObj = root->getObject("cache");
        if (cacheObj) {
            cacheConfig_.productTtlSeconds = cacheObj->getValue<int>("product_ttl_seconds", 300);
            cacheConfig_.maxSize = cacheObj->getValue<int>("max_size", 1000);
        }

        // Rate Limiting
        Poco::JSON::Object::Ptr rateLimitObj = root->getObject("rate_limiting");
        if (rateLimitObj) {
            rateLimitingConfig_.enabled = rateLimitObj->getValue<bool>("enabled", true);
            rateLimitingConfig_.maxRequests = rateLimitObj->getValue<int>("max_requests", 60);
            rateLimitingConfig_.windowSeconds = rateLimitObj->getValue<int>("window_seconds", 60);
        }

    } catch (const Poco::Exception& e) {
        LOG_ERROR << "Failed to parse config file " << configFilePath << ": " << e.displayText();
    } catch (const std::exception& e) {
        LOG_ERROR << "Failed to parse config file " << configFilePath << ": " << e.what();
    }
}

// Helper to get environment variable with a default
std::string getEnv(const std::string& name, const std::string& defaultValue = "") {
    const char* value = std::getenv(name.c_str());
    return value ? value : defaultValue;
}

void ConfigManager::loadFromEnv() {
    // Database
    if (!getEnv("DB_HOST").empty()) dbConfig_.host = getEnv("DB_HOST");
    if (!getEnv("DB_PORT").empty()) dbConfig_.port = std::stoi(getEnv("DB_PORT"));
    if (!getEnv("DB_USER").empty()) dbConfig_.user = getEnv("DB_USER");
    if (!getEnv("DB_PASSWORD").empty()) dbConfig_.password = getEnv("DB_PASSWORD");
    if (!getEnv("DB_NAME").empty()) dbConfig_.dbname = getEnv("DB_NAME");
    // DB_CONNECTION_POOL_SIZE can also be added

    // Server
    if (!getEnv("APP_PORT").empty()) serverConfig_.port = std::stoi(getEnv("APP_PORT"));
    if (!getEnv("APP_LOG_LEVEL").empty()) serverConfig_.logLevel = getEnv("APP_LOG_LEVEL");
    // APP_THREADS can also be added

    // JWT
    if (!getEnv("JWT_SECRET").empty()) jwtConfig_.secret = getEnv("JWT_SECRET");
    // JWT_EXPIRY_MINUTES can also be added

    // Cache
    if (!getEnv("CACHE_PRODUCT_TTL").empty()) cacheConfig_.productTtlSeconds = std::stoi(getEnv("CACHE_PRODUCT_TTL"));
    // CACHE_MAX_SIZE can also be added

    // Rate Limiting
    if (!getEnv("RATE_LIMIT_ENABLED").empty()) rateLimitingConfig_.enabled = (getEnv("RATE_LIMIT_ENABLED") == "true");
    if (!getEnv("RATE_LIMIT_MAX_REQUESTS").empty()) rateLimitingConfig_.maxRequests = std::stoi(getEnv("RATE_LIMIT_MAX_REQUESTS"));
    if (!getEnv("RATE_LIMIT_WINDOW_SECONDS").empty()) rateLimitingConfig_.windowSeconds = std::stoi(getEnv("RATE_LIMIT_WINDOW_SECONDS"));
}

} // namespace AppConfig
```