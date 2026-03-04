```cpp
#ifndef OPTIDB_LOGGER_H
#define OPTIDB_LOGGER_H

#include <spdlog/spdlog.h>
#include <spdlog/sinks/stdout_color_sinks.h>
#include <spdlog/sinks/basic_file_sink.h>
#include <string>
#include <memory>
#include <vector>

enum class LogLevel {
    TRACE = spdlog::level::trace,
    DEBUG = spdlog::level::debug,
    INFO = spdlog::level::info,
    WARN = spdlog::level::warn,
    ERROR = spdlog::level::err,
    CRITICAL = spdlog::level::critical,
    OFF = spdlog::level::off
};

class Logger {
public:
    static void init(LogLevel level, const std::string& log_file = "optidb.log") {
        std::vector<spdlog::sink_ptr> sinks;
        auto console_sink = std::make_shared<spdlog::sinks::stdout_color_sink_mt>();
        console_sink->set_level(static_cast<spdlog::level::level_enum>(level));
        console_sink->set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%^%l%$] [thread %t] %v");
        sinks.push_back(console_sink);

        if (!log_file.empty()) {
            auto file_sink = std::make_shared<spdlog::sinks::basic_file_sink_mt>(log_file, true);
            file_sink->set_level(static_cast<spdlog::level::level_enum>(level));
            file_sink->set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%l] [thread %t] %v");
            sinks.push_back(file_sink);
        }

        auto multi_sink_logger = std::make_shared<spdlog::logger>("optidb_logger", begin(sinks), end(sinks));
        multi_sink_logger->set_level(static_cast<spdlog::level::level_enum>(level));
        spdlog::set_default_logger(multi_sink_logger);
        spdlog::flush_on(spdlog::level::err); // Flush on error to ensure critical messages are written
        spdlog::set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%^%l%$] [thread %t] %v"); // Default pattern for convenience
        spdlog::info("Logger initialized with level {}", spdlog::level::to_string_view(static_cast<spdlog::level::level_enum>(level)));
    }

    static std::shared_ptr<spdlog::logger> get_logger() {
        return spdlog::default_logger();
    }
};

// Convenience macros for logging
#define LOG_TRACE(...) Logger::get_logger()->trace(__VA_ARGS__)
#define LOG_DEBUG(...) Logger::get_logger()->debug(__VA_ARGS__)
#define LOG_INFO(...) Logger::get_logger()->info(__VA_ARGS__)
#define LOG_WARN(...) Logger::get_logger()->warn(__VA_ARGS__)
#define LOG_ERROR(...) Logger::get_logger()->error(__VA_ARGS__)
#define LOG_CRITICAL(...) Logger::get_logger()->critical(__VA_ARGS__)

#endif // OPTIDB_LOGGER_H
```