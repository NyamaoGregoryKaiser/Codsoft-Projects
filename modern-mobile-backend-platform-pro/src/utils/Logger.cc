```cpp
#include "Logger.h"
#include "AppConfig.h" // For reading log level from config
#include <vector>

namespace utils
{
    Logger::Logger()
    {
        try
        {
            // Create sinks
            auto console_sink = std::make_shared<spdlog::sinks::stdout_color_sink_mt>();
            console_sink->set_level(spdlog::level::trace); // Console can show all levels
            console_sink->set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%^%l%$] [thread %t] %v");

            auto file_sink = std::make_shared<spdlog::sinks::rotating_file_sink_mt>(
                "logs/app.log", 1048576 * 5, 3); // 5MB, 3 files
            file_sink->set_level(spdlog::level::info); // File usually logs info and above
            file_sink->set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%l] [thread %t] %v");

            std::vector<spdlog::sink_ptr> sinks {console_sink, file_sink};

            logger_ = std::make_shared<spdlog::logger>("mobile_backend_app", begin(sinks), end(sinks));
            spdlog::register_logger(logger_);

            // Set log level from configuration
            std::string logLevelStr = AppConfig::getInstance().getString("app.logLevel", "info");
            logger_->set_level(stringToLogLevel(logLevelStr));
            logger_->flush_on(spdlog::level::trace); // Flush immediately for critical logs

            LOG_INFO("Logger initialized with level: {}", logLevelStr);
        }
        catch (const spdlog::spdlog_ex &ex)
        {
            std::cerr << "Logger initialization failed: " << ex.what() << std::endl;
            // Fallback to a basic logger if spdlog fails
            logger_ = spdlog::stdout_color_mt("fallback_logger");
            logger_->set_level(spdlog::level::info);
        }
    }

    Logger &Logger::getInstance()
    {
        static Logger instance;
        return instance;
    }

    std::shared_ptr<spdlog::logger> Logger::getLogger() const
    {
        return logger_;
    }

    spdlog::level::level_enum Logger::stringToLogLevel(const std::string &levelStr) const
    {
        if (levelStr == "trace") return spdlog::level::trace;
        if (levelStr == "debug") return spdlog::level::debug;
        if (levelStr == "info") return spdlog::level::info;
        if (levelStr == "warn") return spdlog::level::warn;
        if (levelStr == "error") return spdlog::level::error;
        if (levelStr == "critical") return spdlog::level::critical;
        if (levelStr == "off") return spdlog::level::off;
        LOG_WARN("Unknown log level string: '{}'. Defaulting to 'info'.", levelStr);
        return spdlog::level::info;
    }

} // namespace utils
```