```cpp
#include "utils/Logger.h"
#include "utils/Config.h"
#include "server/Server.h"
#include "db/DBManager.h"
#include <iostream>
#include <stdexcept>

int main() {
    // 1. Initialize Logger
    Logger::init();
    Logger::get_logger()->info("PerfoMetrics Backend Starting...");

    // 2. Load Configuration
    try {
        Config::load(".env");
    } catch (const std::exception& e) {
        Logger::get_logger()->critical("Failed to load configuration: {}", e.what());
        return 1;
    }

    // 3. Initialize Database Manager (and test connection)
    try {
        DBManager::get_instance();
        // Optional: Test connection immediately
        auto conn = DBManager::get_instance().get_connection();
        Logger::get_logger()->info("Successfully connected to database: {}", conn->dbname());
    } catch (const std::exception& e) {
        Logger::get_logger()->critical("Failed to initialize or connect to database: {}", e.what());
        return 1;
    }

    // 4. Start HTTP Server
    try {
        int port = Config::get_int("SERVER_PORT");
        PerfoMetrics::Server server(port);
        Logger::get_logger()->info("PerfoMetrics Server listening on port {}", port);
        server.run();
    } catch (const std::exception& e) {
        Logger::get_logger()->critical("Failed to start server: {}", e.what());
        return 1;
    }

    Logger::get_logger()->info("PerfoMetrics Backend Shutting Down.");
    return 0;
}
```