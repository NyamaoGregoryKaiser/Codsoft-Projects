```cpp
#include "Logger.h"
#include <spdlog/sinks/stdout_color_sinks.h>
#include <spdlog/sinks/rotating_file_sink.h>
#include <spdlog/sinks/daily_file_sink.h>
#include <spdlog/pattern_formatter.h>
#include <nlohmann/json.hpp>
#include <fstream>
#include <stdexcept>

std::shared_ptr<spdlog::logger> Logger::api_logger = nullptr;
std::shared_ptr<spdlog::logger> Logger::console_logger = nullptr;
std::shared_ptr<spdlog::logger> Logger::file_logger = nullptr;

void Logger::init(const std::string& config_filepath) {
    try {
        nlohmann::json log_config;
        if (!config_filepath.empty()) {
            std::ifstream file(config_filepath);
            if (file.is_open()) {
                file >> log_config;
            } else {
                // Fallback to default if config file is not found
                spdlog::warn("Log config file not found: {}. Using default logger settings.", config_filepath);
            }
        }

        std::vector<spdlog::sink_ptr> sinks;

        // Console Sink
        if (log_config.value("enable_console_logging", true)) {
            auto console_sink = std::make_shared<spdlog::sinks::stdout_color_sink_mt>();
            console_sink->set_level(spdlog::level::from_string(log_config.value("console_log_level", "info")));
            sinks.push_back(console_sink);
        }

        // File Sink (Rotating by default)
        if (log_config.value("enable_file_logging", true)) {
            std::string log_file_path = log_config.value("file_path", "logs/application.log");
            size_t max_size = log_config.value("max_file_size_mb", 50) * 1024 * 1024; // 50MB
            size_t max_files = log_config.value("max_files", 5);

            auto file_sink = std::make_shared<spdlog::sinks::rotating_file_sink_mt>(log_file_path, max_size, max_files);
            file_sink->set_level(spdlog::level::from_string(log_config.value("file_log_level", "debug")));
            sinks.push_back(file_sink);
        }

        if (sinks.empty()) {
            // If no sinks are configured, fallback to a basic console logger
            api_logger = spdlog::stdout_color_mt("api_logger");
            api_logger->set_level(spdlog::level::info);
            api_logger->warn("No specific log sinks configured. Using default console logger.");
        } else {
            api_logger = std::make_shared<spdlog::logger>("api_logger", begin(sinks), end(sinks));
            api_logger->set_level(spdlog::level::from_string(log_config.value("global_log_level", "info")));
            api_logger->set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%^%l%$] [thread %t] %v");
        }

        // Set global default logger to allow spdlog::info() etc. directly
        spdlog::set_default_logger(api_logger);
        spdlog::flush_on(spdlog::level::warn); // Flush automatically on warnings and above

        spdlog::info("Logger initialized successfully with {} sinks.", sinks.size());

    } catch (const nlohmann::json::parse_error& e) {
        std::cerr << "CRITICAL: Failed to parse log config file: " << e.what() << std::endl;
        throw; // Re-throw to indicate a critical setup failure
    } catch (const spdlog::spdlog_ex& e) {
        std::cerr << "CRITICAL: Spdlog initialization failed: " << e.what() << std::endl;
        throw; // Re-throw
    } catch (const std::exception& e) {
        std::cerr << "CRITICAL: Logger initialization failed: " << e.what() << std::endl;
        throw; // Re-throw
    }
}

void Logger::flush() {
    if (api_logger) {
        api_logger->flush();
    }
}
```