```cpp
#ifndef OPTIDB_POSTGRES_CONNECTION_H
#define OPTIDB_POSTGRES_CONNECTION_H

#include <pqxx/pqxx>
#include <string>
#include <memory>
#include <mutex>
#include <atomic>
#include <deque>
#include <condition_variable>

#include "utils/logger.h"
#include "config/config.h"
#include "common/exceptions.h"

// Connection pool for the system's own database
class PostgresConnection {
public:
    PostgresConnection(const OptiDBConfig& config, int pool_size = 5);
    ~PostgresConnection();

    // Gets a connection from the pool. Blocks if no connections are available.
    std::shared_ptr<pqxx::connection> get_connection();
    // Returns a connection to the pool.
    void release_connection(std::shared_ptr<pqxx::connection> conn);

    // Static method to create a temporary, one-off connection for target databases
    static std::shared_ptr<pqxx::connection> create_target_db_connection(
        const std::string& host, const std::string& port, const std::string& dbname,
        const std::string& user, const std::string& password, int timeout_ms);

private:
    std::string conn_string_;
    int pool_size_;
    std::deque<std::shared_ptr<pqxx::connection>> connections_;
    std::mutex pool_mutex_;
    std::condition_variable condition_;
    std::atomic<int> current_active_connections_;

    void initialize_pool();
    std::shared_ptr<pqxx::connection> create_new_connection();
};

#endif // OPTIDB_POSTGRES_CONNECTION_H
```