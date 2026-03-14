#include "Logger.h"

std::shared_ptr<spdlog::logger> Logger::loggerInstance = nullptr;

void Logger::init() {
    if (!loggerInstance) {
        loggerInstance = spdlog::stdout_color_mt("auth_system_logger");
        loggerInstance->set_level(spdlog::level::info);
        loggerInstance->set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%^%l%$] [thread %t] %v");
        spdlog::set_default_logger(loggerInstance);
    }
}

std::shared_ptr<spdlog::logger>& Logger::getLogger() {
    if (!loggerInstance) {
        init(); // Ensure logger is initialized if accessed before main init
    }
    return loggerInstance;
}