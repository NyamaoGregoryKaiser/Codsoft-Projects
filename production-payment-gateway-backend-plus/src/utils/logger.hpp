```cpp
#ifndef ZENITH_LOGGER_HPP
#define ZENITH_LOGGER_HPP

#include <spdlog/spdlog.h>
#include <spdlog/sinks/stdout_color_sinks.h>
#include <spdlog/sinks/rotating_file_sink.h>
#include <string>
#include <memory>
#include "../config/config.hpp"

namespace Zenith {
namespace Utils {

class Logger {
public:
    static std::shared_ptr<spdlog::logger>& getLogger() {
        static std::shared_ptr<spdlog::logger> instance = nullptr;
        if (!instance) {
            // Ensure this is only initialized once
            std::call_once(init_flag, []() {
                auto console_sink = std::make_shared<spdlog::sinks::stdout_color_sink_mt>();
                console_sink->set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%^%l%$] [thread %t] %v");

                auto file_sink = std::make_shared<spdlog::sinks::rotating_file_sink_mt>("logs/zenith_payments.log", 1048576 * 5, 3); // 5MB, 3 files
                file_sink->set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%l] [thread %t] %v");

                instance = std::make_shared<spdlog::logger>("zenith_app", spdlog::sinks_init_list{console_sink, file_sink});
                
                // Set log level from config
                std::string log_level_str = Config::AppConfig::getInstance().getLogLevel();
                if (log_level_str == "debug") instance->set_level(spdlog::level::debug);
                else if (log_level_str == "info") instance->set_level(spdlog::level::info);
                else if (log_level_str == "warn") instance->set_level(spdlog::level::warn);
                else if (log_level_str == "error") instance->set_level(spdlog::level::err);
                else if (log_level_str == "critical") instance->set_level(spdlog::level::critical);
                else instance->set_level(spdlog::level::info); // Default

                instance->flush_on(spdlog::level::err); // Flush on error or higher
                spdlog::set_default_logger(instance);
            });
        }
        return instance;
    }

private:
    static std::once_flag init_flag;
    Logger() = delete; // Private constructor to prevent instantiation
    Logger(const Logger&) = delete;
    Logger& operator=(const Logger&) = delete;
};

// Define the static member
std::once_flag Logger::init_flag;

} // namespace Utils
} // namespace Zenith

// Convenience macros for logging
#define LOG_DEBUG(...) Zenith::Utils::Logger::getLogger()->debug(__VA_ARGS__)
#define LOG_INFO(...) Zenith::Utils::Logger::getLogger()->info(__VA_ARGS__)
#define LOG_WARN(...) Zenith::Utils::Logger::getLogger()->warn(__VA_ARGS__)
#define LOG_ERROR(...) Zenith::Utils::Logger::getLogger()->error(__VA_ARGS__)
#define LOG_CRITICAL(...) Zenith::Utils::Logger::getLogger()->critical(__VA_ARGS__)

#endif // ZENITH_LOGGER_HPP
```