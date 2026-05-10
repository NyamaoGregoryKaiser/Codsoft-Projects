```cpp
#ifndef AUTH_SYSTEM_DATABASE_H
#define AUTH_SYSTEM_DATABASE_H

#include <string>
#include <vector>
#include <map>
#include <sqlite3.h>
#include <stdexcept>

class Database {
public:
    explicit Database(const std::string& db_path);
    ~Database();

    void open();
    void close();

    void execute(const std::string& sql);
    
    // Returns rows of key-value pairs
    std::vector<std::map<std::string, std::string>> query(const std::string& sql, 
                                                           const std::vector<std::string>& params = {});

    // Returns a single row, useful for SELECT ... LIMIT 1
    std::map<std::string, std::string> querySingle(const std::string& sql,
                                                   const std::vector<std::string>& params = {});

    // For operations that return the ID of the last inserted row
    long long getLastInsertRowId() const;

private:
    std::string db_path_;
    sqlite3* db_;

    void check_rc(int rc, const std::string& message = "") const;
};

// Custom exception for database errors
class DatabaseException : public std::runtime_error {
public:
    explicit DatabaseException(const std::string& message) : std::runtime_error(message) {}
};

#endif // AUTH_SYSTEM_DATABASE_H
```