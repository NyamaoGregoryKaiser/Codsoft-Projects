```cpp
#include "app.h"
#include "utils/logger.h"
#include "common/constants.h"
#include <iostream>

int main() {
    Logger::init(LogLevel::DEBUG); // Initialize logger

    try {
        OptiDBApp app;
        app.run();
    } catch (const std::exception& e) {
        LOG_CRITICAL("Unhandled exception in main: {}", e.what());
        return 1;
    } catch (...) {
        LOG_CRITICAL("Unknown unhandled exception in main.");
        return 1;
    }

    return 0;
}
```