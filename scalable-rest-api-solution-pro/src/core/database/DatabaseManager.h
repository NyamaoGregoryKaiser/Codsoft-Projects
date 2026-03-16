```cpp
#ifndef DATABASE_MANAGER_H
#define DATABASE_MANAGER_H

#include <soci/soci.h>
#include <soci/sqlite3/soci-sqlite3.h> // For SQLite3 backend
#include <memory>
#include <stdexcept>
#include <vector>
#include <string>

// Custom exception for database errors
class DatabaseException : public std::runtime_error {
public:
    explicit DatabaseException(const std::string& message) : std::runtime_error(message) {}
};

class DatabaseManager {
private:
    static std::unique_ptr<soci::session> sql;

    DatabaseManager() = delete; // Prevent instantiation

public:
    static void init(const std::string& connectionString);
    static soci::session& getSession();

    // Helper to execute a query without returning data
    static void execute(const std::string& query);
};

#endif // DATABASE_MANAGER_H
```