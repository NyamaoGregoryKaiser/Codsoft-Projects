```cpp
#pragma once

#include <spdlog/spdlog.h>
#include <spdlog/sinks/rotating_file_sink.h>
#include <spdlog/sinks/stdout_color_sinks.h>
#include <string>
#include <vector>
#include <memory>

/**
 * @brief Global Logger initialization and access.
 *
 * This class provides a simple wrapper for spdlog to initialize and
 * provide a global logger instance. It sets up both console and rotating file sinks.
 */
class Logger {
public:
    /**
     * @brief Initializes the global logger.
     * @param logLevel The minimum logging level (e.g., "info", "debug", "trace").
     * @param logPath Directory for log files.
     * @param logFile Base name for log files.
     * @param maxFileSize Maximum size of a log file in bytes before rotation.
     * @param maxFiles Maximum number of rotated log files to keep.
     */
    static void init(const std::string& logLevel = "info",
                     const std::string& logPath = "./logs",
                     const std::string& logFile = "mobile_backend.log",
                     size_t maxFileSize = 1048576 * 50, // 50 MB
                     size_t maxFiles = 5);

    /**
     * @brief Get the shared pointer to the logger instance.
     * @return Shared pointer to the spdlog logger.
     */
    static std::shared_ptr<spdlog::logger> getLogger();

private:
    Logger() = delete; // Prevent instantiation
    static std::shared_ptr<spdlog::logger> s_logger;
};

// Convenience macros for logging
#define LOG_TRACE(...) Logger::getLogger()->trace(__VA_ARGS__)
#define LOG_DEBUG(...) Logger::getLogger()->debug(__VA_ARGS__)
#define LOG_INFO(...) Logger::getLogger()->info(__VA_ARGS__)
#define LOG_WARN(...) Logger::getLogger()->warn(__VA_ARGS__)
#define LOG_ERROR(...) Logger::getLogger()->error(__VA_ARGS__)
#define LOG_CRITICAL(...) Logger::getLogger()->critical(__VA_ARGS__)
```