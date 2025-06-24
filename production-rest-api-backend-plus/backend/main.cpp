```cpp
#include "api.h"
#include "database.h"
#include <spdlog/spdlog.h>
#include <iostream>

int main() {
    spdlog::info("Starting Task API...");

    // Initialize database (replace with your actual database initialization)
    Database db;
    db.connect(); // Placeholder for database connection

    // Initialize and start API server
    API api(db);
    api.run();

    spdlog::info("Task API stopped.");
    return 0;
}
```