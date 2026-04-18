```cpp
#include "Logger.h"
#include <vector>

std::shared_ptr<spdlog::logger> Logger::instance;

void Logger::init() {
    if (!instance) {
        auto console_sink = std::make_shared<spdlog::sinks::stdout_color_sink_mt>();
        console_sink->set_level(spdlog::level::debug);
        console_sink->set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%^%l%$] [thread %t] %v");

        auto file_sink = std::make_shared<spdlog::sinks::rotating_file_sink_mt>("logs/perfo_metrics.log", 1048576 * 5, 3); // 5MB, 3 files
        file_sink->set_level(spdlog::level::info);
        file_sink->set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%l] [thread %t] %v");

        std::vector<spdlog::sink_ptr> sinks;
        sinks.push_back(console_sink);
        sinks.push_back(file_sink);

        instance = std::make_shared<spdlog::logger>("perfo_metrics_logger", begin(sinks), end(sinks));
        instance->set_level(spdlog::level::debug);
        instance->flush_on(spdlog::level::info); // Flush logs on info and higher levels
        spdlog::set_default_logger(instance);
        spdlog::info("Logger initialized.");
    }
}

std::shared_ptr<spdlog::logger>& Logger::get_logger() {
    if (!instance) {
        init(); // Ensure logger is initialized if accessed before init() call
    }
    return instance;
}
```