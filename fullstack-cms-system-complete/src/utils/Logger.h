```cpp
#pragma once

#include <drogon/drogon.h> // For drogon::LOG_DEBUG, etc.

namespace ApexContent::Utils {

class Logger {
public:
    static void init();

    // Wrapper macros for easier use, automatically includes file/line
    #define LOG_TRACE DROGON_LOG_TRACE
    #define LOG_DEBUG DROGON_LOG_DEBUG
    #define LOG_INFO  DROGON_LOG_INFO
    #define LOG_WARN  DROGON_LOG_WARN
    #define LOG_ERROR DROGON_LOG_ERROR
    #define LOG_FATAL DROGON_LOG_FATAL
};

} // namespace ApexContent::Utils
```