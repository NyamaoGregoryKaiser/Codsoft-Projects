```cpp
#ifndef PERFOMETRICS_DBMANAGER_H
#define PERFOMETRICS_DBMANAGER_H

#include <string>
#include <memory>
#include <libpqxx/pqxx>
#include "../utils/Logger.h"

class DBManager {
public:
    static DBManager& get_instance();
    std::unique_ptr<pqxx::connection> get_connection();

    // Prevent copy and assignment
    DBManager(const DBManager&) = delete;
    DBManager& operator=(const DBManager&) = delete;

private:
    DBManager(); // Private constructor for singleton
    std::string connection_string;
    static std::unique_ptr<DBManager> instance;
    static std::once_flag init_flag;
};

#endif //PERFOMETRICS_DBMANAGER_H
```