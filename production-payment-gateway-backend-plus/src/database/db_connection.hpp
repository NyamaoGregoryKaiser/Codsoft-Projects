```cpp
#ifndef ZENITH_DB_CONNECTION_HPP
#define ZENITH_DB_CONNECTION_HPP

#include <pqxx/pqxx>
#include <string>
#include <memory>
#include <mutex>
#include "../config/config.hpp"
#include "../utils/logger.hpp"

namespace Zenith {
namespace Database {

class DBConnection {
public:
    // Get the singleton instance
    static DBConnection& getInstance();

    // Get a connection from the pool (or create if pool is empty)
    std::shared_ptr<pqxx::connection> getConnection();

    // Return a connection to the pool
    void releaseConnection(std::shared_ptr<pqxx::connection> conn);

private:
    DBConnection(); // Private constructor for singleton
    DBConnection(const DBConnection&) = delete; // Delete copy constructor
    DBConnection& operator=(const DBConnection&) = delete; // Delete assignment operator

    std::string connectionString_;
    std::vector<std::shared_ptr<pqxx::connection>> connectionPool_;
    std::mutex poolMutex_;
    const size_t MAX_POOL_SIZE = 10; // Max active connections
    const size_t MIN_POOL_SIZE = 2;  // Min connections to keep alive

    void initializePool();
    std::shared_ptr<pqxx::connection> createConnection();
};

} // namespace Database
} // namespace Zenith

#endif // ZENITH_DB_CONNECTION_HPP
```