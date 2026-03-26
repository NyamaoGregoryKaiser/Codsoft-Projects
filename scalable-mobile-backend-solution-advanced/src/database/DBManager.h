```cpp
#pragma once

#include <drogon/drogon.h>
#include <drogon/orm/DbClient.h>
#include <memory>
#include <string>

/**
 * @brief Manages database client instances for Drogon ORM operations.
 *
 * This class provides a centralized way to access the Drogon database client,
 * ensuring proper initialization and potentially managing multiple clients.
 * It uses a singleton pattern for the manager itself.
 */
class DBManager {
public:
    /**
     * @brief Initializes the database client.
     * @param host Database host.
     * @param port Database port.
     * @param user Database user.
     * @param password Database password.
     * @param dbname Database name.
     * @param connNum Number of connections in the pool.
     */
    static void init(const std::string& host, int port,
                     const std::string& user, const std::string& password,
                     const std::string& dbname, size_t connNum = 10);

    /**
     * @brief Get the shared pointer to the database client instance.
     * @return Shared pointer to the drogon::orm::DbClient.
     * @throws std::runtime_error if DBManager is not initialized.
     */
    static drogon::orm::DbClientPtr getClient();

private:
    DBManager() = delete; // Prevent instantiation
    static drogon::orm::DbClientPtr s_dbClient;
};
```