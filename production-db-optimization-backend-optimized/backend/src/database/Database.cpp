```cpp
#include "Database.h"
#include "utils/AppConfig.h"
#include "utils/Logger.h"
#include "common/Error.h"

#include <stdexcept>
#include <chrono>
#include <thread>

std::vector<std::shared_ptr<pqxx::connection>> Database::connectionPool;
std::queue<std::shared_ptr<pqxx::connection>> Database::availableConnections;
std::mutex Database::poolMutex;
bool Database::isPoolInitialized = false;

std::string Database::getConnectionString() {
    return "dbname=" + AppConfig::get("DB_NAME") +
           " user=" + AppConfig::get("DB_USER") +
           " password=" + AppConfig::get("DB_PASSWORD") +
           " host=" + AppConfig::get("DB_HOST") +
           " port=" + AppConfig::get("DB_PORT");
}

void Database::createConnection() {
    std::unique_ptr<pqxx::connection> conn;
    int maxRetries = 5;
    int retryDelayMs = 2000; // 2 seconds

    for (int i = 0; i < maxRetries; ++i) {
        try {
            conn = std::make_unique<pqxx::connection>(getConnectionString());
            if (conn->is_open()) {
                LOG_INFO("Successfully opened database connection.");
                availableConnections.push(std::move(conn)); // Add to available
                return;
            } else {
                LOG_ERROR("Failed to open database connection immediately.");
            }
        } catch (const pqxx::broken_connection& e) {
            LOG_WARN("Database connection broken: {}. Retrying in {}ms...", e.what(), retryDelayMs);
            std::this_thread::sleep_for(std::chrono::milliseconds(retryDelayMs));
        } catch (const std::exception& e) {
            LOG_ERROR("Error creating database connection: {}", e.what());
            throw; // Re-throw other exceptions
        }
    }
    throw DatabaseError("Failed to establish database connection after multiple retries.");
}


void Database::initPool(int poolSize) {
    std::lock_guard<std::mutex> lock(poolMutex);
    if (isPoolInitialized) {
        LOG_WARN("Database pool already initialized.");
        return;
    }

    LOG_INFO("Initializing database connection pool with {} connections...", poolSize);
    for (int i = 0; i < poolSize; ++i) {
        try {
            std::unique_ptr<pqxx::connection> conn_ptr = std::make_unique<pqxx::connection>(getConnectionString());
            if (conn_ptr->is_open()) {
                availableConnections.push(std::move(conn_ptr));
            } else {
                throw DatabaseError("Connection not open after creation.");
            }
        } catch (const std::exception& e) {
            LOG_ERROR("Failed to create connection {}: {}", i + 1, e.what());
            // Depending on policy, might throw or try to continue with fewer connections
            throw DatabaseError("Failed to initialize all database connections: " + std::string(e.what()));
        }
    }
    isPoolInitialized = true;
    LOG_INFO("Database connection pool creation complete. {} connections available.", availableConnections.size());
}

std::shared_ptr<pqxx::connection> Database::getConnection() {
    std::unique_lock<std::mutex> lock(poolMutex);
    if (!isPoolInitialized) {
        throw DatabaseError("Database pool not initialized. Call initPool() first.");
    }

    // Wait until a connection is available
    while (availableConnections.empty()) {
        LOG_WARN("Connection pool exhausted. Waiting for a connection to be released...");
        // In a real application, you might use a condition variable or a timeout here.
        // For simplicity, we just sleep.
        lock.unlock(); // Release lock while waiting
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
        lock.lock(); // Re-acquire lock
    }

    std::shared_ptr<pqxx::connection> conn = availableConnections.front();
    availableConnections.pop();
    LOG_DEBUG("Connection acquired from pool. {} available.", availableConnections.size());
    return conn;
}

void Database::releaseConnection(std::shared_ptr<pqxx::connection> conn) {
    if (!conn) {
        LOG_WARN("Attempted to release a null connection.");
        return;
    }
    std::lock_guard<std::mutex> lock(poolMutex);
    availableConnections.push(conn);
    LOG_DEBUG("Connection released to pool. {} available.", availableConnections.size());
}
```