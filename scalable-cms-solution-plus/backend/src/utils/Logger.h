#pragma once

#include <spdlog/spdlog.h>
#include <spdlog/sinks/daily_file_sink.h>
#include <spdlog/sinks/stdout_color_sinks.h>
#include <memory>
#include <string>

class Logger {
public:
    static void initialize(const std::string& logFilePath, spdlog::level::level_enum logLevel);

    template <typename... Args>
    static void trace(const std::string& format, Args&&... args) {
        if (logger_) logger_->trace(format, std::forward<Args>(args)...);
    }

    template <typename... Args>
    static void debug(const std::string& format, Args&&... args) {
        if (logger_) logger_->debug(format, std::forward<Args>(args)...);
    }

    template <typename... Args>
    static void info(const std::string& format, Args&&... args) {
        if (logger_) logger_->info(format, std::forward<Args>(args)...);
    }

    template <typename... Args>
    static void warn(const std::string& format, Args&&... args) {
        if (logger_) logger_->warn(format, std::forward<Args>(args)...);
    }

    template <typename... Args>
    static void error(const std::string& format, Args&&... args) {
        if (logger_) logger_->error(format, std::forward<Args>(args)...);
    }

    template <typename... Args>
    static void critical(const std::string& format, Args&&... args) {
        if (logger_) logger_->critical(format, std::forward<Args>(args)...);
    }

private:
    static std::shared_ptr<spdlog::logger> logger_;
    Logger() = delete;
    Logger(const Logger&) = delete;
    Logger& operator=(const Logger&) = delete;
};

// Define convenience macros for logging
#define LOG_TRACE(...) Logger::trace(__VA_ARGS__)
#define LOG_DEBUG(...) Logger::debug(__VA_ARGS__)
#define LOG_INFO(...) Logger::info(__VA_ARGS__)
#define LOG_WARN(...) Logger::warn(__VA_ARGS__)
#define LOG_ERROR(...) Logger::error(__VA_ARGS__)
#define LOG_CRITICAL(...) Logger::critical(__VA_ARGS__)
```