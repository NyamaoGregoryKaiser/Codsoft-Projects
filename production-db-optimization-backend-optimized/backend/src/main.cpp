```cpp
#include <iostream>
#include <stdexcept>

#include "server/Server.h"
#include "utils/AppConfig.h"
#include "utils/Logger.h"
#include "database/Database.h"

int main(int argc, char* argv[]) {
    // Initialize Logger early
    Logger::init();
    LOG_INFO("Application starting...");

    try {
        // Load configuration from .env
        AppConfig::loadConfig();

        // Initialize database connection pool
        Database::initPool();
        LOG_INFO("Database connection pool initialized.");

        // Create and start the server
        Server server;
        server.start();

    } catch (const std::runtime_error& e) {
        LOG_ERROR("Fatal runtime error: {}", e.what());
        return EXIT_FAILURE;
    } catch (const pqxx::sql_error& e) {
        LOG_ERROR("Fatal SQL error: {} - Query: {}", e.what(), e.query());
        return EXIT_FAILURE;
    } catch (const std::exception& e) {
        LOG_ERROR("An unexpected error occurred: {}", e.what());
        return EXIT_FAILURE;
    }

    LOG_INFO("Application shutting down.");
    return EXIT_SUCCESS;
}
```