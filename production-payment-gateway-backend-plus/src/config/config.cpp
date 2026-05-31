```cpp
#include "config.hpp"
#include <cstdlib> // For getenv

namespace Zenith {
namespace Config {

AppConfig& AppConfig::getInstance() {
    static AppConfig instance;
    return instance;
}

AppConfig::AppConfig() {
    // Constructor can be used to load config from file if needed
    // For now, relies solely on environment variables
}

std::string AppConfig::getEnv(const std::string& key, const std::string& default_value) const {
    const char* value = std::getenv(key.c_str());
    if (value) {
        return value;
    }
    return default_value;
}

} // namespace Config
} // namespace Zenith
```