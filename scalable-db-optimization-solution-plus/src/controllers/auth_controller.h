```cpp
#ifndef OPTIDB_AUTH_CONTROLLER_H
#define OPTIDB_AUTH_CONTROLLER_H

#include <crow.h>
#include <memory>

#include "services/auth_service.h"
#include "utils/logger.h"
#include "utils/json_util.h"
#include "common/exceptions.h"

class AuthController {
public:
    AuthController(crow::SimpleApp& app, std::shared_ptr<AuthService> auth_service);

private:
    std::shared_ptr<AuthService> auth_service_;

    void setup_routes(crow::SimpleApp& app);
};

#endif // OPTIDB_AUTH_CONTROLLER_H
```