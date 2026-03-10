```cpp
#pragma once

#include <string>
#include <nlohmann/json.hpp>

namespace mlops {
namespace utils {

class Config {
public:
    static Config& getInstance() {
        static Config instance;
        return instance;
    }

    void load(const std::string& filepath);

    // Database settings
    std::string getDbPath() const { return config_["database"]["path"].get<std::string>(); }

    // Server settings
    int getPort() const { return config_["server"]["port"].get<int>(); }
    int getWorkerThreads() const { return config_["server"]["worker_threads"].get<int>(); }

    // Model storage settings
    std::string getModelStoragePath() const { return config_["model_storage"]["path"].get<std::string>(); }

    // Logging settings
    std::string getLogFilePath() const { return config_["logging"]["file"].get<std::string>(); }
    std::string getLogLevel() const { return config_["logging"]["level"].get<std::string>(); }

    // JWT settings
    std::string getJwtSecret() const { return config_["jwt"]["secret"].get<std::string>(); }
    std::string getAuthEnabled() const { return config_["jwt"]["enabled"].get<bool>(); }


private:
    Config() = default;
    ~Config() = default;
    Config(const Config&) = delete;
    Config& operator=(const Config&) = delete;

    nlohmann::json config_;
};

} // namespace utils
} // namespace mlops
```