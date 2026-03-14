#ifndef AUTH_SYSTEM_LOGGER_H
#define AUTH_SYSTEM_LOGGER_H

#include <spdlog/spdlog.h>
#include <spdlog/sinks/stdout_color_sinks.h>
#include <memory>

class Logger {
public:
    static std::shared_ptr<spdlog::logger>& getLogger();
    static void init();

private:
    static std::shared_ptr<spdlog::logger> loggerInstance;
};

#endif //AUTH_SYSTEM_LOGGER_H