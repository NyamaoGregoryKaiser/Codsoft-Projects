#pragma once

#include <string>
#include <memory>
#include <pqxx/pqxx>
#include "common/Error.h"
#include "utils/Logger.h"

namespace DataVizPro {

class DBManager {
public:
    static DBManager& getInstance();

    // Prevent copy and assignment
    DBManager(const DBManager&) = delete;
    DBManager& operator=(const DBManager&) = delete;

    std::unique_ptr<pqxx::connection> getConnection();

    void initialize(const std::string& conn_str);
    void runMigrations(); // Placeholder for migration logic

private:
    DBManager() = default; // Private constructor
    std::string connection_string;
    bool initialized = false;

    // Helper for migrations (actual migration scripts would be external)
    void executeMigration(pqxx::transaction_base& txn, const std::string& query, const std::string& migration_name);
};

} // namespace DataVizPro
```