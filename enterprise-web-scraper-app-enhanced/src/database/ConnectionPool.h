```cpp
#ifndef CONNECTION_POOL_H
#define CONNECTION_POOL_H

#include <pqxx/pqxx>
#include <string>
#include <vector>
#include <queue>
#include <mutex>
#include <condition_variable>
#include <memory>
#include "../utils/Logger.h"
#include "../config/ConfigManager.h"
#include "../utils/ErrorHandler.h"

namespace Scraper {
namespace Database {

class ConnectionPool {
public:
    static ConnectionPool& getInstance() {
        static ConnectionPool instance;
        return instance;
    }

    void init(const std::string& connection_string, size_t pool_size) {
        std::lock_guard<std::mutex> lock(pool_mutex_);
        if (initialized_) {
            Scraper::Utils::Logger::get_logger()->warn("ConnectionPool already initialized. Re-initializing.");
            // Optionally clear existing connections, but safer to prevent re-init.
            return;
        }

        connection_string_ = connection_string;
        pool_size_ = pool_size;
        for (size_t i = 0; i < pool_size_; ++i) {
            try {
                auto conn = std::make_unique<pqxx::connection>(connection_string_);
                connections_.push(std::move(conn));
                Scraper::Utils::Logger::get_logger()->debug("Connection {} added to pool.", i + 1);
            } catch (const pqxx::sql_error& e) {
                Scraper::Utils::Logger::get_logger()->error("Failed to create DB connection: {}", e.what());
                throw Scraper::Utils::DatabaseException("Failed to initialize database connection pool.");
            }
        }
        initialized_ = true;
        Scraper::Utils::Logger::get_logger()->info("Database connection pool initialized with {} connections.", pool_size_);
    }

    std::unique_ptr<pqxx::connection> getConnection() {
        std::unique_lock<std::mutex> lock(pool_mutex_);
        cv_.wait(lock, [this]{ return !connections_.empty(); });
        auto conn = std::move(connections_.front());
        connections_.pop();
        Scraper::Utils::Logger::get_logger()->debug("Retrieved connection from pool. Connections remaining: {}", connections_.size());
        return conn;
    }

    void releaseConnection(std::unique_ptr<pqxx::connection> conn) {
        if (!conn) return;

        std::lock_guard<std::mutex> lock(pool_mutex_);
        // Check if connection is still valid before returning to pool
        if (conn->is_open()) {
            connections_.push(std::move(conn));
            Scraper::Utils::Logger::get_logger()->debug("Released connection to pool. Connections total: {}", connections_.size());
        } else {
            Scraper::Utils::Logger::get_logger()->warn("Released a closed/invalid connection. Attempting to re-establish one.");
            try {
                auto new_conn = std::make_unique<pqxx::connection>(connection_string_);
                connections_.push(std::move(new_conn));
                Scraper::Utils::Logger::get_logger()->info("Re-established and added a new connection to pool.");
            } catch (const pqxx::sql_error& e) {
                Scraper::Utils::Logger::get_logger()->error("Failed to re-establish DB connection: {}", e.what());
            }
        }
        cv_.notify_one();
    }

    size_t getPoolSize() const {
        return pool_size_;
    }

private:
    ConnectionPool() : initialized_(false), pool_size_(0) {}
    ~ConnectionPool() {
        std::lock_guard<std::mutex> lock(pool_mutex_);
        while (!connections_.empty()) {
            connections_.pop(); // Destructs unique_ptr, closing connection
        }
        Scraper::Utils::Logger::get_logger()->info("ConnectionPool destroyed. All connections closed.");
    }

    ConnectionPool(const ConnectionPool&) = delete;
    ConnectionPool& operator=(const ConnectionPool&) = delete;

    std::string connection_string_;
    size_t pool_size_;
    std::queue<std::unique_ptr<pqxx::connection>> connections_;
    std::mutex pool_mutex_;
    std::condition_variable cv_;
    bool initialized_;
};

} // namespace Database
} // namespace Scraper

#endif // CONNECTION_POOL_H
```