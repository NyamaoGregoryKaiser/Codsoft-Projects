```cpp
#ifndef OPTIDB_AUTH_MIDDLEWARE_H
#define OPTIDB_AUTH_MIDDLEWARE_H

#include <crow.h>
#include <memory>
#include <string>

#include "utils/jwt_manager.h"
#include "utils/logger.h"
#include "common/exceptions.h"
#include "common/constants.h" // For AUTHORIZED_USER_ID_KEY

namespace middleware {

class AuthMiddleware : public crow::ILogMiddleware {
public:
    AuthMiddleware(std::shared_ptr<JWTManager> jwt_manager);

    void before_handle(crow::request& req, crow::response& res, crow::context& ctx);
    void after_handle(crow::request& req, crow::response& res, crow::context& ctx);

private:
    std::shared_ptr<JWTManager> jwt_manager_;
};

} // namespace middleware

#endif // OPTIDB_AUTH_MIDDLEWARE_H
```