```cpp
#pragma once

#include <string>
#include <iostream>
#include <fstream>
#include <mutex>
#include "Types.h" // For LogLevel

namespace mlops {
namespace utils {

class Logger {
public:
    static Logger& getInstance() {
        static Logger instance;
        return instance;
    }

    void init(const std::string& filename, LogLevel level) {
        log_file_.open(filename, std::ios_base::app);
        if (!log_file_.is_open()) {
            std::cerr << "ERROR: Could not open log file: " << filename << std::endl;
        }
        min_level_ = level;
    }

    void log(LogLevel level, const std::string& message) {
        if (level < min_level_) {
            return;
        }

        std::lock_guard<std::mutex> lock(mtx_);
        std::string level_str;
        std::ostream* os;

        switch (level) {
            case LogLevel::INFO:  level_str = "INFO"; os = &std::cout; break;
            case LogLevel::WARN:  level_str = "WARN"; os = &std::cerr; break;
            case LogLevel::ERROR: level_str = "ERROR"; os = &std::cerr; break;
            case LogLevel::DEBUG: level_str = "DEBUG"; os = &std::cout; break;
            default: level_str = "UNKNOWN"; os = &std::cout; break;
        }

        std::string timestamp = getCurrentTimestamp();
        std::string log_entry = "[" + timestamp + "][" + level_str + "] " + message;

        *os << log_entry << std::endl;
        if (log_file_.is_open()) {
            log_file_ << log_entry << std::endl;
        }
    }

    void info(const std::string& message) { log(LogLevel::INFO, message); }
    void warn(const std::string& message) { log(LogLevel::WARN, message); }
    void error(const std::string& message) { log(LogLevel::ERROR, message); }
    void debug(const std::string& message) { log(LogLevel::DEBUG, message); }

private:
    Logger() = default;
    ~Logger() {
        if (log_file_.is_open()) {
            log_file_.close();
        }
    }
    Logger(const Logger&) = delete;
    Logger& operator=(const Logger&) = delete;

    std::ofstream log_file_;
    std::mutex mtx_;
    LogLevel min_level_ = LogLevel::INFO;
};

} // namespace utils
} // namespace mlops

// Global macros for easier logging
#define LOG_INFO(msg)    mlops::utils::Logger::getInstance().info(msg)
#define LOG_WARN(msg)    mlops::utils::Logger::getInstance().warn(msg)
#define LOG_ERROR(msg)   mlops::utils::Logger::getInstance().error(msg)
#define LOG_DEBUG(msg)   mlops::utils::Logger::getInstance().debug(msg)
```