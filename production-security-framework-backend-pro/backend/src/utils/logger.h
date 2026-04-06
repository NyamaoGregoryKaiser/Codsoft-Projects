#pragma once

#include <spdlog/spdlog.h>
#include <spdlog/sinks/stdout_color_sinks.h>
#include <spdlog/sinks/basic_file_sink.h>
#include <string>
#include <memory>
#include "app_config.h" // For log level config

namespace Logger {

class AppLogger {
public:
    static std::shared_ptr<spdlog::logger>& get() {
        static auto logger = init();
        return logger;
    }

private:
    static std::shared_ptr<spdlog::logger> init() {
        auto console_sink = std::make_shared<spdlog::sinks::stdout_color_sink_mt>();
        console_sink->set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%^%l%$] [thread %t] %v");

        auto file_sink = std::make_shared<spdlog::sinks::basic_file_sink_mt>("logs/app.log", true);
        file_sink->set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%l] [thread %t] %v");

        std::vector<spdlog::sink_ptr> sinks {console_sink, file_sink};
        auto logger = std::make_shared<spdlog::logger>("secure_app", begin(sinks), end(sinks));
        logger->set_level(spdlog::level::info); // Default level

        // Set log level from config
        try {
            const auto& config = AppConfig::Config::getInstance();
            if (config.log_level == "trace") logger->set_level(spdlog::level::trace);
            else if (config.log_level == "debug") logger->set_level(spdlog::level::debug);
            else if (config.log_level == "info") logger->set_level(spdlog::level::info);
            else if (config.log_level == "warn") logger->set_level(spdlog::level::warn);
            else if (config.log_level == "error") logger->set_level(spdlog::level::err);
            else if (config.log_level == "critical") logger->set_level(spdlog::level::critical);
            else if (config.log_level == "off") logger->set_level(spdlog::level::off);
        } catch (const std::runtime_error& e) {
            std::cerr << "Warning: Could not set log level from config: " << e.what() << std::endl;
        }

        logger->flush_on(spdlog::level::err); // Flush on errors
        return logger;
    }

    AppLogger() = delete;
    AppLogger(const AppLogger&) = delete;
    AppLogger& operator=(const AppLogger&) = delete;
};

#define LOG_TRACE(...) Logger::AppLogger::get()->trace(__VA_ARGS__)
#define LOG_DEBUG(...) Logger::AppLogger::get()->debug(__VA_ARGS__)
#define LOG_INFO(...) Logger::AppLogger::get()->info(__VA_ARGS__)
#define LOG_WARN(...) Logger::AppLogger::get()->warn(__VA_ARGS__)
#define LOG_ERROR(...) Logger::AppLogger::get()->error(__VA_ARGS__)
#define LOG_CRITICAL(...) Logger::AppLogger::get()->critical(__VA_ARGS__)

} // namespace Logger