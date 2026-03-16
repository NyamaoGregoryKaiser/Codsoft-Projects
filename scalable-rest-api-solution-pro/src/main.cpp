```cpp
#include "app/App.h"
#include "core/utils/Config.h"
#include "core/utils/Logger.h"
#include "core/database/DatabaseManager.h"
#include <iostream>
#include <stdexcept>

int main(int argc, char* argv[]) {
    // 1. Initialize Configuration
    try {
        Config::load("config.json"); // Load main config
        Logger::init(Config::get("log_config_path", "config/log_config.json"));
    } catch (const std::exception& e) {
        std::cerr << "Failed to initialize configuration or logger: " << e.what() << std::endl;
        return 1;
    }
    
    // 2. Initialize Database
    try {
        std::string db_path = Config::get("db_path", "database/project_management.db");
        Logger::info("Initializing database at: {}", db_path);
        DatabaseManager::init(db_path);
        Logger::info("Database initialized successfully.");
    } catch (const std::exception& e) {
        Logger::critical("Failed to initialize database: {}", e.what());
        return 1;
    }

    // 3. Start API Server
    try {
        std::string host = Config::get("server_host", "0.0.0.0");
        int port = std::stoi(Config::get("server_port", "9080"));
        Logger::info("Starting API server on {}:{}", host, port);

        App app(host, port);
        app.start();

    } catch (const std::exception& e) {
        Logger::critical("API server failed to start: {}", e.what());
        return 1;
    }

    return 0;
}
```