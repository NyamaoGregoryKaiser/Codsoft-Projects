```cpp
#include "Logger.h"
#include <iostream>

namespace AppUtils {

void Logger::init(const std::string& level, const std::string& logFilePath) {
    Poco::AutoPtr<Poco::SplitterChannel> pSplitter = new Poco::SplitterChannel;

    // Console Channel
    Poco::AutoPtr<Poco::ConsoleChannel> pCons = new Poco::ConsoleChannel;
    Poco::AutoPtr<Poco::PatternFormatter> pPFCons = new Poco::PatternFormatter;
    pPFCons->setProperty("pattern", "%Y-%m-%d %H:%M:%S.%i %{%l}{%L}: %t"); // Example: 2023-10-27 10:30:00.123 DEBUG: My message
    pPFCons->autoDelete(true);
    Poco::AutoPtr<Poco::FormattingChannel> pFCons = new Poco::FormattingChannel(pPFCons, pCons);
    pSplitter->addChannel(pFCons);

    // File Channel (if logFilePath is provided)
    if (!logFilePath.empty()) {
        Poco::AutoPtr<Poco::FileChannel> pFile = new Poco::FileChannel;
        pFile->setProperty("path", logFilePath);
        pFile->setProperty("rotation", "2M"); // Rotate every 2MB
        pFile->setProperty("archive", "timestamp"); // Archive with timestamp
        pFile->setProperty("compress", "true"); // Compress archived logs
        pFile->autoDelete(true);
        Poco::AutoPtr<Poco::PatternFormatter> pPFFile = new Poco::PatternFormatter;
        pPFFile->setProperty("pattern", "%Y-%m-%d %H:%M:%S.%i %{%l}{%L}: %t");
        pPFFile->autoDelete(true);
        Poco::AutoPtr<Poco::FormattingChannel> pFFile = new Poco::FormattingChannel(pPFFile, pFile);
        pSplitter->addChannel(pFFile);
    }

    Poco::Logger& root = Poco::Logger::root();
    root.setChannel(pSplitter);

    if (level == "TRACE") root.setLevel(Poco::Message::PRIO_TRACE);
    else if (level == "DEBUG") root.setLevel(Poco::Message::PRIO_DEBUG);
    else if (level == "INFO") root.setLevel(Poco::Message::PRIO_INFORMATION);
    else if (level == "WARN") root.setLevel(Poco::Message::PRIO_WARNING);
    else if (level == "ERROR") root.setLevel(Poco::Message::PRIO_ERROR);
    else if (level == "FATAL") root.setLevel(Poco::Message::PRIO_FATAL);
    else root.setLevel(Poco::Message::PRIO_INFORMATION); // Default to INFO

    Poco::Logger::get("ProductCatalogService").setParent(&root);

    LOG_INFO << "Logger initialized with level: " << level << (logFilePath.empty() ? "" : ", logging to file: " + logFilePath);
}

} // namespace AppUtils
```