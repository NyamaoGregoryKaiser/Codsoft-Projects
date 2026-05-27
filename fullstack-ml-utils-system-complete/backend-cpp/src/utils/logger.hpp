#ifndef ML_UTILITIES_SYSTEM_LOGGER_HPP
#define ML_UTILITIES_SYSTEM_LOGGER_HPP

#include "spdlog/spdlog.h"
#include "spdlog/sinks/stdout_color_sinks.h"
#include "spdlog/sinks/basic_file_sink.h"
#include "../config/config.hpp" // For Config::get
#include <memory>
#include <string>
#include <vector>
#include <stdexcept>
#include <iostream> // For fallback logging

/**
 * @brief Global logger instance for the application.
 *
 * This class provides a static interface to initialize and use `spdlog`
 * for structured and flexible logging.
 */
class Logger {
private:
    static std::shared_ptr<spdlog::logger> app_logger;

    // Private constructor to prevent instantiation
    Logger() = delete;

public:
    /**
     * @brief Initializes the global application logger.
     *
     * Sets up console and file sinks, log level, and pattern.
     * This method should be called once at the application startup.
     *
     * @param console_enabled If true, logs will also be output to console.
     */
    static void init(bool console_enabled = true) {
        if (app_logger) {
            // Already initialized
            return;
        }

        std::vector<spdlog::sink_ptr> sinks;

        if (console_enabled) {
            sinks.push_back(std::make_shared<spdlog::sinks::stdout_color_sink_mt>());
        }

        try {
            std::string log_file_path = Config::get("LOG_FILE_PATH", "./logs/ml_backend.log");
            sinks.push_back(std::make_shared<spdlog::sinks::basic_file_sink_mt>(log_file_path, true));
        } catch (const std::exception& e) {
            // Fallback: If config is not loaded or file path is invalid, log to console
            std::cerr << "Error configuring file logger: " << e.what() << ". Falling back to console logging." << std::endl;
        }

        app_logger = std::make_shared<spdlog::logger>("ml_backend", begin(sinks), end(sinks));
        spdlog::register_logger(app_logger);

        // Set log level
        std::string log_level_str;
        try {
            log_level_str = Config::get("LOG_LEVEL", "info");
        } catch (...) {
            log_level_str = "info"; // Default if config not available
        }
        
        if (log_level_str == "trace") app_logger->set_level(spdlog::level::trace);
        else if (log_level_str == "debug") app_logger->set_level(spdlog::level::debug);
        else if (log_level_str == "info") app_logger->set_level(spdlog::level::info);
        else if (log_level_str == "warn") app_logger->set_level(spdlog::level::warn);
        else if (log_level_str == "error") app_logger->set_level(spdlog::level::err);
        else if (log_level_str == "critical") app_logger->set_level(spdlog::level::critical);
        else {
            app_logger->set_level(spdlog::level::info);
            app_logger->warn("Invalid LOG_LEVEL '{}' specified. Defaulting to 'info'.", log_level_str);
        }

        // Set format: [YYYY-MM-DD HH:MM:SS.mmm] [level] [thread_id] [source_file:line] message
        app_logger->set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%^%l%$] [%t] [%s:%#] %v");
        app_logger->flush_on(spdlog::level::err); // Flush on error to ensure critical logs are written
    }

    /**
     * @brief Returns the global logger instance.
     * @return A shared pointer to the `spdlog::logger` instance.
     * @throws std::runtime_error if the logger has not been initialized.
     */
    static std::shared_ptr<spdlog::logger> getLogger() {
        if (!app_logger) {
            // Fallback: if getLogger is called before init, try to init with defaults
            std::cerr << "Logger not initialized. Attempting default initialization." << std::endl;
            init(true); // Initialize with console enabled
            if (!app_logger) {
                 throw std::runtime_error("Logger not initialized and failed to initialize on demand.");
            }
        }
        return app_logger;
    }

    /**
     * @brief Shuts down the logger.
     * Flushes any buffered messages and releases resources.
     */
    static void shutdown() {
        if (app_logger) {
            spdlog::drop_all();
            spdlog::shutdown();
            app_logger.reset();
        }
    }
};

// Static member initialization
std::shared_ptr<spdlog::logger> Logger::app_logger = nullptr;

// Convenience macros for logging
#define LOG_TRACE(...) Logger::getLogger()->trace(__VA_ARGS__)
#define LOG_DEBUG(...) Logger::getLogger()->debug(__VA_ARGS__)
#define LOG_INFO(...)  Logger::getLogger()->info(__VA_ARGS__)
#define LOG_WARN(...)  Logger::getLogger()->warn(__VA_ARGS__)
#define LOG_ERROR(...) Logger::getLogger()->error(__VA_ARGS__)
#define LOG_CRITICAL(...) Logger::getLogger()->critical(__VA_ARGS__)

#endif // ML_UTILITIES_SYSTEM_LOGGER_HPP
```