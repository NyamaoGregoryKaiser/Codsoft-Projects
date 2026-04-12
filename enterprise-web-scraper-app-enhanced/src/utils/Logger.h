```cpp
#ifndef LOGGER_H
#define LOGGER_H

#include <spdlog/spdlog.h>
#include <spdlog/sinks/stdout_color_sinks.h>
#include <spdlog/sinks/rotating_file_sink.h>
#include <memory>
#include <vector>

namespace Scraper {
namespace Utils {

class Logger {
public:
    static std::shared_ptr<spdlog::logger>& get_logger() {
        if (!instance) {
            init();
        }
        return instance;
    }

    static void init(const std::string& logger_name = "scraper_app",
                     const std::string& log_file_path = "logs/scraper_app.log",
                     size_t max_size = 1048576 * 5, // 5MB
                     size_t max_files = 3) {
        if (instance) {
            // Already initialized, no-op or re-initialize
            spdlog::drop(logger_name); // Drop existing logger if re-initializing
        }

        auto console_sink = std::make_shared<spdlog::sinks::stdout_color_sink_mt>();
        console_sink->set_level(spdlog::level::info);
        console_sink->set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%^%l%$] [thread %t] %v");

        auto file_sink = std::make_shared<spdlog::sinks::rotating_file_sink_mt>(log_file_path, max_size, max_files);
        file_sink->set_level(spdlog::level::debug);
        file_sink->set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%l] [thread %t] %v");

        std::vector<spdlog::sink_ptr> sinks {console_sink, file_sink};
        instance = std::make_shared<spdlog::logger>(logger_name, begin(sinks), end(sinks));
        instance->set_level(spdlog::level::debug); // Global default level
        instance->flush_on(spdlog::level::warn); // Flush log buffer on warnings/errors

        spdlog::set_default_logger(instance);
        spdlog::info("Logger initialized successfully.");
    }

private:
    static std::shared_ptr<spdlog::logger> instance;
    Logger() = delete; // Disallow instantiation
};

// Static member definition
std::shared_ptr<spdlog::logger> Logger::instance = nullptr;

} // namespace Utils
} // namespace Scraper

#endif // LOGGER_H
```