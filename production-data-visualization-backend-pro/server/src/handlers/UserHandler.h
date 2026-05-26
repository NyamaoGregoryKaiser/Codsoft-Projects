#pragma once

#include <crow.h>
#include "auth/AuthManager.h"
#include "common/Constants.h"

namespace DataVizPro {

class UserHandler {
public:
    UserHandler();

    void registerRoutes(crow::App<AuthMiddleware, ErrorMiddleware>& app);

private:
    AuthManager auth_manager;

    crow::response handleRegister(const crow::request& req);
    crow::response handleLogin(const crow::request& req);
    crow::response handleGetUserProfile(const crow::request& req, AuthMiddleware::context& ctx);
};

} // namespace DataVizPro
```