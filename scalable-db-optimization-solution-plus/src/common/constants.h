```cpp
#ifndef OPTIDB_CONSTANTS_H
#define OPTIDB_CONSTANTS_H

#include <string>

// Key used to store authorized user ID in crow::context
const std::string AUTHORIZED_USER_ID_KEY = "authorized_user_id";

// Default log file name
const std::string DEFAULT_LOG_FILE = "optidb.log";

#endif // OPTIDB_CONSTANTS_H
```