#ifndef ML_UTILITIES_SYSTEM_DB_CONNECTION_HPP
#define ML_UTILITIES_SYSTEM_DB_CONNECTION_HPP

#include <string>
#include <vector>
#include <memory>
#include <queue>
#include <mutex>
#include <condition_variable>
#include <pqxx/pqxx>
#include "../utils/logger.hpp"

/**
 * @brief Manages a connection to a PostgreSQL database.
 *
 * This class encapsulates `pqxx::connection` and handles its lifecycle.
 */
class DBConnection {
private:
    std::unique_ptr<pqxx::connection> conn;
    std::string connection_string;

public:
    /**
     * @brief Constructs a DBConnection object.
     * @param conn_str The PostgreSQL connection string.
     */
    explicit DBConnection(const std::string& conn_str) : connection_string(conn_str) {
        connect();
    }

    /**
     * @brief Destructor that closes the connection if open.
     */
    ~DBConnection() {
        disconnect();
    }

    // Delete copy constructor and assignment operator to prevent issues with unique_ptr
    DBConnection(const DBConnection&) = delete;
    DBConnection& operator=(const DBConnection&) = delete;

    /**
     * @brief Establishes a connection to the database.
     * @throws pqxx::broken_connection if connection fails.
     */
    void connect() {
        try {
            conn = std::make_unique<pqxx::connection>(connection_string);
            if (conn->is_open()) {
                LOG_DEBUG("Database connection opened successfully.");
            } else {
                LOG_ERROR("Failed to open database connection.");
                throw pqxx::broken_connection("Failed to open database connection.");
            }
        } catch (const pqxx::sql_error& e) {
            LOG_CRITICAL("SQL Error during connection: {}. Query: {}", e.what(), e.query());
            throw;
        } catch (const std::exception& e) {
            LOG_CRITICAL("Exception during database connection: {}", e.what());
            throw;
        }
    }

    /**
     * @brief Disconnects from the database.
     */
    void disconnect() {
        if (conn && conn->is_open()) {
            conn->disconnect();
            LOG_DEBUG("Database connection disconnected.");
        }
    }

    /**
     * @brief Retrieves the underlying `pqxx::connection` object.
     * @return A reference to the `pqxx::connection` object.
     * @throws std::runtime_error if connection is not open.
     */
    pqxx::connection& get() {
        if (!conn || !conn->is_open()) {
            LOG_WARN("Attempted to use a closed/invalid DB connection. Reconnecting...");
            connect(); // Attempt to reconnect
            if (!conn || !conn->is_open()) {
                throw std::runtime_error("DB connection is not open and failed to reconnect.");
            }
        }
        return *conn;
    }
};

/**
 * @brief Manages a pool of database connections.
 *
 * This class provides a thread-safe connection pool for PostgreSQL,
 * allowing multiple threads to share and reuse connections efficiently.
 */
class DBConnectionPool {
private:
    std::queue<std::unique_ptr<DBConnection>> pool;
    std::mutex mtx;
    std::condition_variable cv;
    std::string connection_string;
    int max_pool_size;
    int current_pool_size = 0;

    /**
     * @brief Creates a new database connection.
     * @return A unique pointer to a new DBConnection object.
     */
    std::unique_ptr<DBConnection> createConnection() {
        return std::make_unique<DBConnection>(connection_string);
    }

public:
    /**
     * @brief Constructs a DBConnectionPool object.
     * @param host Database host.
     * @param port Database port.
     * @param dbname Database name.
     * @param user Database user.
     * @param password Database password.
     * @param max_size Maximum number of connections in the pool.
     */
    DBConnectionPool(const std::string& host, const std::string& port,
                     const std::string& dbname, const std::string& user,
                     const std::string& password, int max_size)
        : max_pool_size(max_size) {
        connection_string = "host=" + host +
                            " port=" + port +
                            " dbname=" + dbname +
                            " user=" + user +
                            " password=" + password;

        // Pre-fill the pool with some initial connections
        for (int i = 0; i < max_pool_size / 2; ++i) { // Start with half capacity
            try {
                pool.push(createConnection());
                current_pool_size++;
            } catch (const std::exception& e) {
                LOG_ERROR("Failed to pre-fill DB connection pool with connection {}: {}", i, e.what());
                // Continue, but log the error. The pool might be smaller than desired.
            }
        }
        LOG_INFO("DBConnectionPool initialized with {} connections (max {}).", current_pool_size, max_pool_size);
    }

    /**
     * @brief Destructor that closes all connections in the pool.
     */
    ~DBConnectionPool() {
        std::lock_guard<std::mutex> lock(mtx);
        while (!pool.empty()) {
            pool.pop(); // Unique_ptr automatically calls destructor
        }
        LOG_INFO("DBConnectionPool destroyed, all connections closed.");
    }

    /**
     * @brief Acquires a database connection from the pool.
     *
     * If no connections are available and pool size is less than max, a new one is created.
     * Otherwise, it waits for an available connection.
     *
     * @return A unique pointer to an acquired DBConnection.
     */
    std::unique_ptr<DBConnection> acquireConnection() {
        std::unique_lock<std::mutex> lock(mtx);
        while (pool.empty() && current_pool_size >= max_pool_size) {
            LOG_DEBUG("DBConnectionPool: Waiting for available connection (current size: {}).", current_pool_size);
            cv.wait(lock); // Wait until a connection is returned or created
        }

        if (!pool.empty()) {
            std::unique_ptr<DBConnection> conn = std::move(pool.front());
            pool.pop();
            LOG_DEBUG("DBConnectionPool: Acquired existing connection. Pool size: {}", pool.size());
            return conn;
        } else { // pool is empty, but current_pool_size < max_pool_size, so create new
            try {
                std::unique_ptr<DBConnection> conn = createConnection();
                current_pool_size++;
                LOG_INFO("DBConnectionPool: Created new connection. Total connections: {}", current_pool_size);
                return conn;
            } catch (const std::exception& e) {
                LOG_ERROR("DBConnectionPool: Failed to create new connection: {}", e.what());
                throw;
            }
        }
    }

    /**
     * @brief Releases a database connection back to the pool.
     * @param conn The unique pointer to the DBConnection to release.
     */
    void releaseConnection(std::unique_ptr<DBConnection> conn) {
        if (!conn) return;

        std::lock_guard<std::mutex> lock(mtx);
        // Add connection back to the pool only if it's still healthy
        try {
            if (conn->get().is_open()) {
                pool.push(std::move(conn));
                LOG_DEBUG("DBConnectionPool: Released connection. Pool size: {}", pool.size());
            } else {
                // If connection is broken, discard it and decrement current_pool_size
                current_pool_size--;
                LOG_WARN("DBConnectionPool: Discarded broken connection. Total connections: {}", current_pool_size);
            }
        } catch (const std::exception& e) {
            // This might happen if conn->get() throws
            current_pool_size--;
            LOG_ERROR("DBConnectionPool: Error checking connection health on release: {}. Discarding.", e.what());
        }
        cv.notify_one(); // Notify waiting threads that a connection is available
    }

    /**
     * @brief Get the current number of active connections (in use or in pool).
     * @return The count of current connections.
     */
    int getCurrentPoolSize() const {
        return current_pool_size;
    }
};

/**
 * @brief Helper class for RAII-style connection acquisition and release.
 */
class ScopedConnection {
private:
    DBConnectionPool* pool;
    std::unique_ptr<DBConnection> conn;

public:
    ScopedConnection(DBConnectionPool* pool_ptr) : pool(pool_ptr) {
        if (!pool) {
            throw std::runtime_error("DBConnectionPool pointer is null.");
        }
        conn = pool->acquireConnection();
    }

    ~ScopedConnection() {
        if (pool && conn) {
            pool->releaseConnection(std::move(conn));
        }
    }

    // Delete copy constructor and assignment operator
    ScopedConnection(const ScopedConnection&) = delete;
    ScopedConnection& operator=(const ScopedConnection&) = delete;

    pqxx::connection& get() {
        return conn->get();
    }

    pqxx::connection* operator->() {
        return &conn->get();
    }
};

#endif // ML_UTILITIES_SYSTEM_DB_CONNECTION_HPP
```