```cpp
#ifndef OPTIDB_LOGGING_MIDDLEWARE_H
#define OPTIDB_LOGGING_MIDDLEWARE_H

#include <crow.h>
#include "utils/logger.h"
#include <chrono>

namespace middleware {

class LoggingMiddleware : public crow::ILogMiddleware {
public:
    LoggingMiddleware();

    void before_handle(crow::request& req, crow::response& res, crow::context& ctx);
    void after_handle(crow::request& req, crow::response& res, crow::context& ctx);
};

} // namespace middleware

#endif // OPTIDB_LOGGING_MIDDLEWARE_H
```