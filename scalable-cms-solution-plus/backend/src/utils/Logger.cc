#include "Logger.h"

std::shared_ptr<spdlog::logger> Logger::logger_;

void Logger::initialize(const std::string& logFilePath, spdlog::level::level_enum logLevel) {
    try {
        auto console_sink = std::make_shared<spdlog::sinks::stdout_color_sink_mt>();
        console_sink->set_level(logLevel);
        console_sink->set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%^%l%$] [%s:%#] %v"); // With file/line number

        auto file_sink = std::make_shared<spdlog::sinks::daily_file_sink_mt>(logFilePath, 0, 0);
        file_sink->set_level(logLevel);
        file_sink->set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%l] [%s:%#] %v");

        logger_ = std::make_shared<spdlog::logger>("cms_logger", spdlog::sinks_init_list{console_sink, file_sink});
        logger_->set_level(logLevel);
        logger_->flush_on(spdlog::level::err); // Flush on error and critical messages
        spdlog::set_default_logger(logger_);
        spdlog::set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%^%l%$] [thread %t] %v"); // Default pattern without file/line for general use if not using macros

        LOG_INFO("Logger successfully initialized to file {} with level {}. Console output enabled.", logFilePath, spdlog::level::to_string_view(logLevel));

    } catch (const spdlog::spdlog_ex &ex) {
        std::cerr << "Log initialization failed: " << ex.what() << std::endl;
        // Fallback to basic cout if logger initialization fails
    }
}
```