```cpp
#ifndef PERFOMETRICS_LOGGER_H
#define PERFOMETRICS_LOGGER_H

#include <spdlog/spdlog.h>
#include <spdlog/sinks/stdout_color_sinks.h>
#include <spdlog/sinks/rotating_file_sink.h>
#include <memory>

class Logger {
public:
    static void init();
    static std::shared_ptr<spdlog::logger>& get_logger();

private:
    static std::shared_ptr<spdlog::logger> instance;
};

#endif //PERFOMETRICS_LOGGER_H
```