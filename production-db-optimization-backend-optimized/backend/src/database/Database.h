```cpp
#ifndef DATABASE_H
#define DATABASE_H

#include <pqxx/pqxx>
#include <string>
#include <vector>
#include <memory>
#include <mutex>
#include <queue>
#include <functional>

// Forward declarations for models
struct Product;
struct Category;
struct Manufacturer;
struct User;

class Database {
public:
    // Initialize connection pool (call once at application start)
    static void initPool(int poolSize = 5);

    // Get a connection from the pool
    static std::shared_ptr<pqxx::connection> getConnection();

    // Release a connection back to the pool
    static void releaseConnection(std::shared_ptr<pqxx::connection> conn);

    // Transactional execution (utility for complex operations)
    template<typename Func>
    static auto executeTransaction(Func&& func) {
        auto conn = getConnection();
        try {
            pqxx::work txn(*conn); // Start a transaction
            auto result = func(txn);
            txn.commit(); // Commit if successful
            releaseConnection(conn);
            return result;
        } catch (const pqxx::sql_error& e) {
            LOG_ERROR("SQL transaction error: {}", e.what());
            // txn will rollback automatically on destruction if not committed
            releaseConnection(conn);
            throw;
        } catch (const std::exception& e) {
            LOG_ERROR("General transaction error: {}", e.what());
            releaseConnection(conn);
            throw;
        }
    }

private:
    static std::vector<std::shared_ptr<pqxx::connection>> connectionPool;
    static std::queue<std::shared_ptr<pqxx::connection>> availableConnections;
    static std::mutex poolMutex;
    static bool isPoolInitialized;

    static std::string getConnectionString();
    static void createConnection();
};

#endif // DATABASE_H
```