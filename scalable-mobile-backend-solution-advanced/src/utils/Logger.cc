```cpp
#include "Logger.h"
#include <filesystem>

// Static member definition
std::shared_ptr<spdlog::logger> Logger::s_logger = nullptr;

void Logger::init(const std::string& logLevel,
                  const std::string& logPath,
                  const std::string& logFile,
                  size_t maxFileSize,
                  size_t maxFiles) {
    if (s_logger) {
        // Logger already initialized
        return;
    }

    std::filesystem::path logDirPath = logPath;
    if (!std::filesystem::exists(logDirPath)) {
        std::filesystem::create_directories(logDirPath);
    }

    std::vector<spdlog::sink_ptr> sinks;
    sinks.push_back(std::make_shared<spdlog::sinks::stdout_color_sink_mt>());
    sinks.push_back(std::make_shared<spdlog::sinks::rotating_file_sink_mt>(
        (logDirPath / logFile).string(), maxFileSize, maxFiles));

    s_logger = std::make_shared<spdlog::logger>("MobileBackend", begin(sinks), end(sinks));
    spdlog::register_logger(s_logger);

    s_logger->set_level(spdlog::level::from_string(logLevel));
    s_logger->set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%^%l%$] [%P:%t] %v");
    s_logger->flush_on(spdlog::level::warn); // Flush on important messages

    // Global spdlog settings
    spdlog::set_default_logger(s_logger);
    spdlog::set_level(spdlog::level::from_string(logLevel));
    spdlog::set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%^%l%$] [%P:%t] %v"); // Default pattern

    LOG_INFO("Logger initialized with level: {} to path: {}", logLevel, (logDirPath / logFile).string());
}

std::shared_ptr<spdlog::logger> Logger::getLogger() {
    if (!s_logger) {
        // Fallback or default initialization if not called explicitly
        init();
    }
    return s_logger;
}
```