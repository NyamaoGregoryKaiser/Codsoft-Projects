#pragma once

#include <crow.h>
#include "middleware/AuthMiddleware.h"
#include "models/Dashboard.h"
#include "db/DBManager.h"
#include "db/SQLQueries.h"
#include "common/Constants.h"

namespace DataVizPro {

class DashboardHandler {
public:
    DashboardHandler();

    void registerRoutes(crow::App<AuthMiddleware, ErrorMiddleware>& app);

private:
    // Helper to retrieve a dashboard from DB
    Dashboard getDashboardByIdAndUser(const std::string& dashboard_id, const std::string& user_id);

    crow::response handleCreateDashboard(const crow::request& req, AuthMiddleware::context& ctx);
    crow::response handleGetDashboard(const crow::request& req, const std::string& dashboard_id, AuthMiddleware::context& ctx);
    crow::response handleGetAllDashboards(const crow::request& req, AuthMiddleware::context& ctx);
    crow::response handleUpdateDashboard(const crow::request& req, const std::string& dashboard_id, AuthMiddleware::context& ctx);
    crow::response handleDeleteDashboard(const crow::request& req, const std::string& dashboard_id, AuthMiddleware::context& ctx);
};

} // namespace DataVizPro
```