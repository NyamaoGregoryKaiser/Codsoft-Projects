```cpp
#include "postgres_connection.h"
#include <thread> // For std::this_thread::sleep_for
#include <chrono>

PostgresConnection::PostgresConnection(const OptiDBConfig& config, int pool_size)
    : pool_size_(pool_size), current_active_connections_(0) {
    conn_string_ = "host=" + config.db_host +
                   " port=" + config.db_port +
                   " dbname=" + config.db_name +
                   " user=" + config.db_user +
                   " password=" + config.db_password;
    initialize_pool();
}

PostgresConnection::~PostgresConnection() {
    std::lock_guard<std::mutex> lock(pool_mutex_);
    connections_.clear(); // Connections will be closed as shared_ptr destructs
    LOG_INFO("PostgresConnection pool shut down.");
}

void PostgresConnection::initialize_pool() {
    std::lock_guard<std::mutex> lock(pool_mutex_);
    for (int i = 0; i < pool_size_; ++i) {
        try {
            connections_.push_back(create_new_connection());
        } catch (const pqxx::broken_connection& e) {
            LOG_ERROR("Failed to create initial DB connection {}: {}", i, e.what());
            // Optionally, try to reconnect or throw a fatal error
        } catch (const std::exception& e) {
            LOG_ERROR("Unexpected error during DB pool initialization {}: {}", i, e.what());
        }
    }
    LOG_INFO("PostgresConnection pool initialized with {} connections.", connections_.size());
}

std::shared_ptr<pqxx::connection> PostgresConnection::create_new_connection() {
    LOG_DEBUG("Creating new Postgres connection.");
    // In a real application, you might add retry logic here
    auto conn = std::make_shared<pqxx::connection>(conn_string_);
    conn->set_client_encoding("UTF8");
    LOG_DEBUG("New Postgres connection established.");
    return conn;
}

std::shared_ptr<pqxx::connection> PostgresConnection::get_connection() {
    std::unique_lock<std::mutex> lock(pool_mutex_);
    condition_.wait(lock, [this]{ return !connections_.empty() || current_active_connections_ < pool_size_; });

    if (!connections_.empty()) {
        auto conn = connections_.front();
        connections_.pop_front();
        current_active_connections_++;
        LOG_DEBUG("Reused connection from pool. Active: {}", current_active_connections_.load());
        return conn;
    } else {
        // Pool is empty but we haven't reached max_size (implying another thread is about to return one)
        // Or, more robustly, if pool_size is a hard limit, throw/wait longer.
        // For simplicity, we assume if condition.wait passes and connections is empty,
        // it's because current_active_connections_ < pool_size_ was true.
        // This scenario implies we could create a new connection if `pool_size_` was a max, not fixed.
        // For a fixed pool, this path should not be hit if initialize_pool worked.
        LOG_WARN("Postgres connection pool exhausted. Waiting for connection release.");
        throw DatabaseException("Postgres connection pool exhausted. Please try again later.");
    }
}

void PostgresConnection::release_connection(std::shared_ptr<pqxx::connection> conn) {
    std::unique_lock<std::mutex> lock(pool_mutex_);
    if (conn && conn->is_open()) {
        connections_.push_back(conn);
        current_active_connections_--;
        LOG_DEBUG("Released connection to pool. Active: {}", current_active_connections_.load());
    } else {
        LOG_WARN("Attempted to release a null or closed connection to the pool.");
        // If connection is broken, don't add it back, and maybe try to replace it.
        // For simplicity, we just don't add it back.
        if (current_active_connections_ > 0) current_active_connections_--; // Decrement if it was an active but broken one
    }
    condition_.notify_one();
}

std::shared_ptr<pqxx::connection> PostgresConnection::create_target_db_connection(
    const std::string& host, const std::string& port, const std::string& dbname,
    const std::string& user, const std::string& password, int timeout_ms) {
    std::string conn_str = "host=" + host +
                           " port=" + port +
                           " dbname=" + dbname +
                           " user=" + user +
                           " password=" + password +
                           " connect_timeout=" + std::to_string(timeout_ms / 1000); // pqxx timeout is in seconds

    LOG_DEBUG("Attempting to connect to target DB: host={}, port={}, dbname={}, user={}",
              host, port, dbname, user); // Don't log password

    try {
        auto conn = std::make_shared<pqxx::connection>(conn_str);
        conn->set_client_encoding("UTF8");
        LOG_INFO("Successfully connected to target DB: {}", dbname);
        return conn;
    } catch (const pqxx::broken_connection& e) {
        LOG_ERROR("Failed to connect to target DB {}: {}", dbname, e.what());
        throw DatabaseConnectionException(std::string("Failed to connect to target database: ") + e.what());
    } catch (const std::exception& e) {
        LOG_ERROR("Error creating target DB connection {}: {}", dbname, e.what());
        throw DatabaseConnectionException(std::string("Error creating target DB connection: ") + e.what());
    }
}
```