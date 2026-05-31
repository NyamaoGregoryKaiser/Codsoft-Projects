```cpp
#include "db_connection.hpp"
#include <stdexcept>
#include <sstream>

namespace Zenith {
namespace Database {

DBConnection& DBConnection::getInstance() {
    static DBConnection instance;
    return instance;
}

DBConnection::DBConnection() {
    const auto& config = Config::AppConfig::getInstance();
    std::ostringstream oss;
    oss << "host=" << config.getDbHost()
        << " port=" << config.getDbPort()
        << " user=" << config.getDbUser()
        << " password=" << config.getDbPassword()
        << " dbname=" << config.getDbName();
    connectionString_ = oss.str();

    LOG_INFO("Initializing DB connection pool with string: {0}", connectionString_);
    initializePool();
}

void DBConnection::initializePool() {
    std::lock_guard<std::mutex> lock(poolMutex_);
    for (size_t i = 0; i < MIN_POOL_SIZE; ++i) {
        try {
            connectionPool_.push_back(createConnection());
            LOG_DEBUG("Added connection {0} to pool.", i + 1);
        } catch (const pqxx::sql_error& e) {
            LOG_CRITICAL("Failed to initialize DB connection {0}: {1}", i + 1, e.what());
            // Depending on policy, might exit or rethrow here
            throw;
        }
    }
    LOG_INFO("DB connection pool initialized with {0} connections.", connectionPool_.size());
}

std::shared_ptr<pqxx::connection> DBConnection::createConnection() {
    try {
        auto conn = std::make_shared<pqxx::connection>(connectionString_);
        if (!conn->is_open()) {
            throw std::runtime_error("Failed to open database connection.");
        }
        return conn;
    } catch (const pqxx::pqxx_exception& e) {
        LOG_ERROR("Failed to create new DB connection: {0}", e.what());
        throw;
    }
}

std::shared_ptr<pqxx::connection> DBConnection::getConnection() {
    std::unique_lock<std::mutex> lock(poolMutex_);
    if (!connectionPool_.empty()) {
        auto conn = connectionPool_.back();
        connectionPool_.pop_back();
        LOG_DEBUG("Reusing connection from pool. Pool size: {0}", connectionPool_.size());
        return conn;
    }

    if (connectionPool_.size() < MAX_POOL_SIZE) { // Technically, pool.size() will be 0 here if empty
        // No connections in pool, create a new one if max size allows
        lock.unlock(); // Release lock temporarily to create connection
        auto conn = createConnection();
        lock.lock(); // Re-acquire lock to return
        LOG_DEBUG("Created new connection. Pool size: {0}", connectionPool_.size());
        return conn;
    }

    // Pool is full and empty, wait or throw (for this example, we throw)
    LOG_ERROR("DB connection pool is exhausted and at max capacity.");
    throw std::runtime_error("Database connection pool exhausted.");
}

void DBConnection::releaseConnection(std::shared_ptr<pqxx::connection> conn) {
    std::lock_guard<std::mutex> lock(poolMutex_);
    if (conn && conn->is_open()) {
        connectionPool_.push_back(conn);
        LOG_DEBUG("Released connection to pool. Pool size: {0}", connectionPool_.size());
    } else {
        LOG_WARN("Attempted to release an invalid or closed connection.");
    }
}

} // namespace Database
} // namespace Zenith
```