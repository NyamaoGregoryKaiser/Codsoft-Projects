```cpp
#pragma once

#include <Poco/Logger.h>
#include <Poco/Message.h>
#include <Poco/FormattingChannel.h>
#include <Poco/PatternFormatter.h>
#include <Poco/ConsoleChannel.h>
#include <Poco/FileChannel.h>
#include <Poco/SplitterChannel.h>
#include <Poco/AutoPtr.h>

#define LOG_TRACE   Poco::Logger::get("ProductCatalogService").trace
#define LOG_DEBUG   Poco::Logger::get("ProductCatalogService").debug
#define LOG_INFO    Poco::Logger::get("ProductCatalogService").information
#define LOG_WARN    Poco::Logger::get("ProductCatalogService").warning
#define LOG_ERROR   Poco::Logger::get("ProductCatalogService").error
#define LOG_FATAL   Poco::Logger::get("ProductCatalogService").fatal

namespace AppUtils {

class Logger {
public:
    static void init(const std::string& level, const std::string& logFilePath = "");

private:
    Logger() = delete;
};

} // namespace AppUtils
```