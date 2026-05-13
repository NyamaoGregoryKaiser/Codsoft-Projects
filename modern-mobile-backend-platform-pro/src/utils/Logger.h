```cpp
#pragma once

#include <spdlog/spdlog.h>
#include <spdlog/sinks/stdout_color_sinks.h>
#include <spdlog/sinks/rotating_file_sink.h>
#include <memory>
#include <string>

// Define macros for easier logging
#define LOG_TRACE(...) utils::Logger::getInstance().getLogger()->trace(__VA_ARGS__)
#define LOG_DEBUG(...) utils::Logger::getInstance().getLogger()->debug(__VA_ARGS__)
#define LOG_INFO(...)  utils::Logger::getInstance().getLogger()->info(__VA_ARGS__)
#define LOG_WARN(...)  utils::Logger::getInstance().getLogger()->warn(__VA_ARGS__)
#define LOG_ERROR(...) utils::Logger::getInstance().getLogger()->error(__VA_ARGS__)
#define LOG_CRITICAL(...) utils::Logger::getInstance().getLogger()->critical(__VA_ARGS__)

namespace utils
{
    /**
     * @brief Singleton class for application-wide logging using spdlog.
     * Provides a configured logger instance with console and file sinks.
     */
    class Logger
    {
    public:
        // Delete copy constructor and assignment operator for Singleton pattern
        Logger(const Logger &) = delete;
        Logger &operator=(const Logger &) = delete;

        /**
         * @brief Get the singleton instance of Logger.
         * @return Reference to the Logger instance.
         */
        static Logger &getInstance();

        /**
         * @brief Get the shared pointer to the spdlog logger.
         * @return Shared pointer to the spdlog logger.
         */
        std::shared_ptr<spdlog::logger> getLogger() const;

    private:
        Logger(); // Private constructor for Singleton
        std::shared_ptr<spdlog::logger> logger_;

        /**
         * @brief Converts a string log level to spdlog::level::level_enum.
         * @param levelStr The string representation of the log level.
         * @return The corresponding spdlog::level::level_enum.
         */
        spdlog::level::level_enum stringToLogLevel(const std::string &levelStr) const;
    };

} // namespace utils
```