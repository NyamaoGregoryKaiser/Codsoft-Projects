```cpp
#ifndef OPTIDB_ERROR_MIDDLEWARE_H
#define OPTIDB_ERROR_MIDDLEWARE_H

#include <crow.h>
#include "utils/logger.h"
#include "common/exceptions.h"
#include "utils/json_util.h" // For to_json helper

namespace middleware {

class ErrorMiddleware : public crow::ILogMiddleware {
public:
    ErrorMiddleware();

    void before_handle(crow::request& req, crow::response& res, crow::context& ctx);
    void after_handle(crow::request& req, crow::response& res, crow::context& ctx);
};

} // namespace middleware

#endif // OPTIDB_ERROR_MIDDLEWARE_H
```