```cpp
#pragma once

#include <drogon/orm/DbClient.h>
#include <memory>
#include <string>

namespace AppDb {

// Singleton wrapper for Drogon's DbClient for PostgreSQL
class DbClient {
public:
    static DbClient& getInstance();

    // Initialize the database client with connection details
    void initialize(const std::string& host, int port, const std::string& user,
                    const std::string& password, const std::string& dbname,
                    int connectionPoolSize);

    // Get a reference to the underlying Drogon DbClient
    drogon::orm::DbClient& client();

private:
    DbClient() = default;
    DbClient(const DbClient&) = delete;
    DbClient& operator=(const DbClient&) = delete;

    std::unique_ptr<drogon::orm::DbClient> dbClient_;
    bool initialized_ = false;
};

} // namespace AppDb
```