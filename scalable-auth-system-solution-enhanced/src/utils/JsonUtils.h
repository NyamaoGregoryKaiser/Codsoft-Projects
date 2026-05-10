```cpp
#ifndef AUTH_SYSTEM_JSON_UTILS_H
#define AUTH_SYSTEM_JSON_UTILS_H

#include "crow.h"
#include <string>

namespace JsonUtils {

    // Helper to send a standardized success JSON response
    crow::response sendSuccess(crow::response& res, 
                               const std::string& message = "Success", 
                               const crow::json::wvalue& data = crow::json::wvalue(), 
                               int http_status = 200);

    // Helper to send a standardized error JSON response
    crow::response sendError(crow::response& res, 
                             const std::string& error_code, 
                             const std::string& message, 
                             int http_status = 500,
                             const crow::json::wvalue& details = crow::json::wvalue());
}

#endif // AUTH_SYSTEM_JSON_UTILS_H
```