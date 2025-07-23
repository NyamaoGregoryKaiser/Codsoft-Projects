```cpp
#ifndef DATABASE_H
#define DATABASE_H

#include <string>
#include <memory>
#include "scraper.h" // Include ScrapedData

class Database {
public:
    Database(const std::string& connectionString);
    bool connect();
    void insertData(const ScrapedData& data);

private:
    std::string m_connectionString;
    std::unique_ptr<pqxx::connection> m_conn;
};

#endif
```