#pragma once

#include <spdlog/spdlog.h>
#include <spdlog/sinks/stdout_color_sinks.h>
#include <spdlog/sinks/rotating_file_sink.h>
#include <memory>
#include <string>

namespace Logger {

    inline std::shared_ptr<spdlog::logger> get_logger() {
        static std::shared_ptr<spdlog::logger> logger;
        if (!logger) {
            // Console sink for development/stdout
            auto console_sink = std::make_shared<spdlog::sinks::stdout_color_sink_mt>();
            console_sink->set_level(spdlog::level::trace);

            // Rotating file sink for production logs
            // Logs to "logs/dataviz_server.log", max 10MB, keep 3 files
            auto file_sink = std::make_shared<spdlog::sinks::rotating_file_sink_mt>("logs/dataviz_server.log", 1024 * 1024 * 10, 3);
            file_sink->set_level(spdlog::level::info);

            spdlog::sinks_init_list sink_list = {console_sink, file_sink};
            logger = std::make_shared<spdlog::logger>("DataVizPro", sink_list.begin(), sink_list.end());
            logger->set_level(spdlog::level::debug); // Global log level
            logger->flush_on(spdlog::level::warn);   // Flush immediately on warnings
            spdlog::set_default_logger(logger);
            spdlog::set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%^%l%$] [thread %t] %v");
        }
        return logger;
    }

    // Helper macros for easy logging
    #define LOG_TRACE(...) spdlog::trace(__VA_ARGS__)
    #define LOG_DEBUG(...) spdlog::debug(__VA_ARGS__)
    #define LOG_INFO(...)  spdlog::info(__VA_ARGS__)
    #define LOG_WARN(...)  spdlog::warn(__VA_ARGS__)
    #define LOG_ERROR(...) spdlog::error(__VA_ARGS__)
    #define LOG_CRITICAL(...) spdlog::critical(__VA_ARGS__)

} // namespace Logger
```