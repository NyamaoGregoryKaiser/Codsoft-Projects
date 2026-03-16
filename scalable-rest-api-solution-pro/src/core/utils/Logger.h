```cpp
#ifndef LOGGER_H
#define LOGGER_H

#include <spdlog/spdlog.h>
#include <spdlog/fmt/ostr.h> // Required for operator<< overloads
#include <string>
#include <memory>

class Logger {
private:
    static std::shared_ptr<spdlog::logger> api_logger;
    static std::shared_ptr<spdlog::logger> console_logger;
    static std::shared_ptr<spdlog::logger> file_logger;

    Logger() = delete; // Prevent instantiation

public:
    static void init(const std::string& config_filepath = "");

    template<typename FormatString, typename... Args>
    static void trace(const FormatString &fmt, const Args &...args) {
        if (api_logger) api_logger->trace(fmt, args...);
    }

    template<typename FormatString, typename... Args>
    static void debug(const FormatString &fmt, const Args &...args) {
        if (api_logger) api_logger->debug(fmt, args...);
    }

    template<typename FormatString, typename... Args>
    static void info(const FormatString &fmt, const Args &...args) {
        if (api_logger) api_logger->info(fmt, args...);
    }

    template<typename FormatString, typename... Args>
    static void warn(const FormatString &fmt, const Args &...args) {
        if (api_logger) api_logger->warn(fmt, args...);
    }

    template<typename FormatString, typename... Args>
    static void error(const FormatString &fmt, const Args &...args) {
        if (api_logger) api_logger->error(fmt, args...);
    }

    template<typename FormatString, typename... Args>
    static void critical(const FormatString &fmt, const Args &...args) {
        if (api_logger) api_logger->critical(fmt, args...);
    }

    // Explicitly flush logs (useful before application exit)
    static void flush();
};

#endif // LOGGER_H
```