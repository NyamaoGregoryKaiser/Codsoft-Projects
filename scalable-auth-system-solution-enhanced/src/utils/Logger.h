```cpp
#ifndef AUTH_SYSTEM_LOGGER_H
#define AUTH_SYSTEM_LOGGER_H

#include "../config/Config.h" // For LogLevel enum
#include <string>
#include <iostream>
#include <mutex> // For thread safety
#include <chrono> // For timestamps
#include <iomanip> // For std::put_time
#include <sstream> // For stringstream

// Simple variadic template for formatted output
void log_impl(std::ostream& os, const char* format);

template<typename T, typename... Args>
void log_impl(std::ostream& os, const char* format, T value, Args... args) {
    while (*format) {
        if (*format == '%' && *(format + 1) != '\0') {
            if (*(format + 1) == '%') { // Handle "%%" for literal %
                os << *format;
                format += 2;
            } else {
                os << value;
                log_impl(os, format + 2, args...); // Process next argument
                return;
            }
        } else {
            os << *format;
            format++;
        }
    }
}

class Logger {
public:
    static void setLogLevel(LogLevel level);
    static LogLevel getLogLevel();
    static std::string getCurrentTimestamp();

    template<typename... Args>
    static void log(LogLevel level, const char* file, int line, const char* format, Args... args) {
        if (level < currentLogLevel) {
            return;
        }

        std::lock_guard<std::mutex> lock(mtx_);
        std::cerr << "[" << getCurrentTimestamp() << "] ";
        std::cerr << "[" << logLevelToString(level) << "] ";
        std::cerr << "(" << file << ":" << line << ") ";
        log_impl(std::cerr, format, args...);
        std::cerr << std::endl;
    }

private:
    static LogLevel currentLogLevel;
    static std::mutex mtx_;

    static std::string logLevelToString(LogLevel level);
};

// Convenience macros for logging
#define LOG_DEBUG(format, ...) Logger::log(DEBUG, __FILE__, __LINE__, format, ##__VA_ARGS__)
#define LOG_INFO(format, ...)  Logger::log(INFO,  __FILE__, __LINE__, format, ##__VA_ARGS__)
#define LOG_WARN(format, ...)  Logger::log(WARN,  __FILE__, __LINE__, format, ##__VA_ARGS__)
#define LOG_ERROR(format, ...) Logger::log(ERROR, __FILE__, __LINE__, format, ##__VA_ARGS__)
#define LOG_FATAL(format, ...) Logger::log(FATAL, __FILE__, __LINE__, format, ##__VA_ARGS__)

#endif // AUTH_SYSTEM_LOGGER_H
```