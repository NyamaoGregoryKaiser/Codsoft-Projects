```cpp
#include "database.h"
#include <pqxx/pqxx> // PostgreSQL library

bool Database::connect() {
    try {
        m_conn = std::make_unique<pqxx::connection>(m_connectionString);
        return true;
    } catch (const pqxx::pqxx_exception& e) {
        std::cerr << "Database connection error: " << e.what() << std::endl;
        return false;
    }
}

void Database::insertData(const ScrapedData& data) {
    try {
        pqxx::work txn(*m_conn);
        // ...SQL insert statement using parameterized queries to prevent SQL injection...
        txn.commit();
    } catch (const pqxx::pqxx_exception& e) {
        std::cerr << "Database insertion error: " << e.what() << std::endl;
    }
}

```