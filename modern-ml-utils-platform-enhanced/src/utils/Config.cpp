```cpp
#include "Config.h"
#include "Logger.h"
#include <fstream>
#include <stdexcept>

namespace mlops {
namespace utils {

void Config::load(const std::string& filepath) {
    std::ifstream file(filepath);
    if (!file.is_open()) {
        LOG_ERROR("Failed to open config file: " + filepath);
        throw std::runtime_error("Failed to open config file: " + filepath);
    }

    try {
        file >> config_;
        LOG_INFO("Configuration loaded from " + filepath);
    } catch (const nlohmann::json::parse_error& e) {
        LOG_ERROR("Failed to parse config file " + filepath + ": " + e.what());
        throw std::runtime_error("Failed to parse config file: " + filepath + " - " + e.what());
    } catch (const std::exception& e) {
        LOG_ERROR("Error loading config file " + filepath + ": " + e.what());
        throw std::runtime_error("Error loading config file: " + filepath + " - " + e.what());
    }
}

} // namespace utils
} // namespace mlops
```