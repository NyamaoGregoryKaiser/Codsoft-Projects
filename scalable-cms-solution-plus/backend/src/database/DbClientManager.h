#pragma once

#include <drogon/drogon.h>
#include <memory>
#include <mutex>

class DbClientManager {
public:
    static DbClientManager& instance();

    void init();

    // Get a pointer to the default database client
    // Ensures client is ready, potentially reconnecting
    drogon::orm::DbClientPtr getDbClient();

private:
    DbClientManager();
    DbClientManager(const DbClientManager&) = delete;
    DbClientManager& operator=(const DbClientManager&) = delete;

    drogon::orm::DbClientPtr defaultClient_;
    std::mutex clientMutex_; // Protect client access and reconnection
    bool initialized_;
};
```