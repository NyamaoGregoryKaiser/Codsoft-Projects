#include "DashboardHandler.h"
#include "utils/Logger.h"
#include "common/Error.h"
#include <nlohmann/json.hpp>
#include <boost/uuid/uuid.hpp>            // for uuid
#include <boost/uuid/uuid_generators.hpp> // for uuid generators
#include <boost/uuid/uuid_io.hpp>         // for uuid to string conversion

namespace DataVizPro {

DashboardHandler::DashboardHandler() {}

void DashboardHandler::registerRoutes(crow::App<AuthMiddleware, ErrorMiddleware>& app) {
    CROW_ROUTE(app, Constants::API_VERSION + "/dashboards").methods("POST"_method)(
        [&](const crow::request& req, AuthMiddleware::context& ctx) {
            return handleCreateDashboard(req, ctx);
        }
    );

    CROW_ROUTE(app, Constants::API_VERSION + "/dashboards/<string>").methods("GET"_method)(
        [&](const crow::request& req, const std::string& dashboard_id, AuthMiddleware::context& ctx) {
            return handleGetDashboard(req, dashboard_id, ctx);
        }
    );

    CROW_ROUTE(app, Constants::API_VERSION + "/dashboards").methods("GET"_method)(
        [&](const crow::request& req, AuthMiddleware::context& ctx) {
            return handleGetAllDashboards(req, ctx);
        }
    );

    CROW_ROUTE(app, Constants::API_VERSION + "/dashboards/<string>").methods("PUT"_method)(
        [&](const crow::request& req, const std::string& dashboard_id, AuthMiddleware::context& ctx) {
            return handleUpdateDashboard(req, dashboard_id, ctx);
        }
    );

    CROW_ROUTE(app, Constants::API_VERSION + "/dashboards/<string>").methods("DELETE"_method)(
        [&](const crow::request& req, const std::string& dashboard_id, AuthMiddleware::context& ctx) {
            return handleDeleteDashboard(req, dashboard_id, ctx);
        }
    );

    LOG_INFO("Dashboard routes registered.");
}

Dashboard DashboardHandler::getDashboardByIdAndUser(const std::string& dashboard_id, const std::string& user_id) {
    auto conn = DBManager::getInstance().getConnection();
    pqxx::nontransaction N(*conn);

    pqxx::result r = N.exec_params(SQLQueries::SELECT_DASHBOARD_BY_ID_AND_USER, pqxx::uuid_string(dashboard_id), pqxx::uuid_string(user_id));

    if (r.empty()) {
        throw DataVizError(ErrorCode::NOT_FOUND, "Dashboard not found or unauthorized access", "", 404);
    }

    Dashboard dashboard;
    dashboard.id = r[0]["id"].as<std::string>();
    dashboard.user_id = r[0]["user_id"].as<std::string>();
    dashboard.name = r[0]["name"].as<std::string>();
    dashboard.description = r[0]["description"].as<std::string>();
    dashboard.config = nlohmann::json::parse(r[0]["config"].as<std::string>());
    dashboard.created_at = r[0]["created_at"].as<std::chrono::system_clock::time_point>();
    dashboard.updated_at = r[0]["updated_at"].as<std::chrono::system_clock::time_point>();

    return dashboard;
}

crow::response DashboardHandler::handleCreateDashboard(const crow::request& req, AuthMiddleware::context& ctx) {
    crow::response res;
    res.set_header("Content-Type", "application/json");
    try {
        nlohmann::json req_body = nlohmann::json::parse(req.body);
        if (!req_body.contains("name")) {
            throw DataVizError(ErrorCode::BAD_REQUEST, "Missing required field: name", "", 400);
        }

        std::string name = req_body["name"].get<std::string>();
        std::string description = req_body.contains("description") ? req_body["description"].get<std::string>() : "";
        nlohmann::json config = req_body.contains("config") ? req_body["config"] : nlohmann::json::object();

        if (name.empty()) {
            throw DataVizError(ErrorCode::INVALID_INPUT, "Dashboard name cannot be empty", "", 400);
        }

        auto conn = DBManager::getInstance().getConnection();
        pqxx::work txn(*conn);

        pqxx::result r = txn.exec_params(
            SQLQueries::INSERT_DASHBOARD,
            pqxx::uuid_string(ctx.user_id),
            name,
            description,
            config.dump()
        );
        txn.commit();

        if (r.empty()) {
            throw DataVizError(ErrorCode::DB_ERROR, "Failed to create dashboard: no ID returned", "", 500);
        }

        Dashboard new_dashboard;
        new_dashboard.id = r[0][0].as<std::string>();
        new_dashboard.user_id = ctx.user_id;
        new_dashboard.name = name;
        new_dashboard.description = description;
        new_dashboard.config = config;
        new_dashboard.created_at = std::chrono::system_clock::now(); // Set by DB, for immediate use

        res.code = 201; // Created
        res.write(new_dashboard.toJson().dump());
        LOG_INFO("Dashboard '{}' (ID: {}) created by user {}", name, new_dashboard.id, ctx.user_id);

    } catch (const nlohmann::json::parse_error& e) {
        throw DataVizError(ErrorCode::BAD_REQUEST, "Invalid JSON format", e.what(), 400);
    } catch (const pqxx::unique_violation& e) {
        throw DataVizError(ErrorCode::DUPLICATE_ENTRY, "Dashboard with this name already exists for this user.", e.what(), 409);
    } catch (const pqxx::sql_error& e) {
        LOG_ERROR("Database error creating dashboard: {}", e.what());
        throw DataVizError(ErrorCode::DB_ERROR, "Failed to create dashboard", e.what(), 500);
    }
    return res;
}

crow::response DashboardHandler::handleGetDashboard(const crow::request& req, const std::string& dashboard_id, AuthMiddleware::context& ctx) {
    crow::response res;
    res.set_header("Content-Type", "application/json");
    try {
        Dashboard dashboard = getDashboardByIdAndUser(dashboard_id, ctx.user_id);
        res.code = 200;
        res.write(dashboard.toJson().dump());
    } catch (const DataVizError& e) {
        throw;
    }
    return res;
}

crow::response DashboardHandler::handleGetAllDashboards(const crow::request& req, AuthMiddleware::context& ctx) {
    crow::response res;
    res.set_header("Content-Type", "application/json");
    try {
        auto conn = DBManager::getInstance().getConnection();
        pqxx::nontransaction N(*conn);
        pqxx::result r = N.exec_params(SQLQueries::SELECT_ALL_DASHBOARDS_BY_USER, pqxx::uuid_string(ctx.user_id));

        nlohmann::json dashboards_json = nlohmann::json::array();
        for (const auto& row : r) {
            Dashboard dashboard;
            dashboard.id = row["id"].as<std::string>();
            dashboard.user_id = row["user_id"].as<std::string>();
            dashboard.name = row["name"].as<std::string>();
            dashboard.description = row["description"].as<std::string>();
            dashboard.created_at = row["created_at"].as<std::chrono::system_clock::time_point>();
            // config is not retrieved in this summary query
            dashboards_json.push_back(dashboard.toJson());
        }
        res.code = 200;
        res.write(dashboards_json.dump());
    } catch (const pqxx::sql_error& e) {
        LOG_ERROR("Database error fetching all dashboards: {}", e.what());
        throw DataVizError(ErrorCode::DB_ERROR, "Failed to retrieve dashboards", e.what(), 500);
    }
    return res;
}

crow::response DashboardHandler::handleUpdateDashboard(const crow::request& req, const std::string& dashboard_id, AuthMiddleware::context& ctx) {
    crow::response res;
    res.set_header("Content-Type", "application/json");
    try {
        nlohmann::json req_body = nlohmann::json::parse(req.body);
        if (!req_body.contains("name")) {
            throw DataVizError(ErrorCode::BAD_REQUEST, "Missing required field: name", "", 400);
        }

        std::string name = req_body["name"].get<std::string>();
        std::string description = req_body.contains("description") ? req_body["description"].get<std::string>() : "";
        nlohmann::json config = req_body.contains("config") ? req_body["config"] : nlohmann::json::object();

        if (name.empty()) {
            throw DataVizError(ErrorCode::INVALID_INPUT, "Dashboard name cannot be empty", "", 400);
        }

        // Check if dashboard exists and user is authorized (done by getDashboardByIdAndUser)
        Dashboard existing_dashboard = getDashboardByIdAndUser(dashboard_id, ctx.user_id);

        auto conn = DBManager::getInstance().getConnection();
        pqxx::work txn(*conn);

        pqxx::result r = txn.exec_params(
            SQLQueries::UPDATE_DASHBOARD,
            name,
            description,
            config.dump(),
            pqxx::uuid_string(dashboard_id),
            pqxx::uuid_string(ctx.user_id)
        );
        txn.commit();

        if (r.empty()) {
            throw DataVizError(ErrorCode::NOT_FOUND, "Dashboard not found or unauthorized to update", "", 404);
        }

        existing_dashboard.name = name;
        existing_dashboard.description = description;
        existing_dashboard.config = config;
        existing_dashboard.updated_at = std::chrono::system_clock::now();

        res.code = 200;
        res.write(existing_dashboard.toJson().dump());
        LOG_INFO("Dashboard '{}' (ID: {}) updated by user {}", name, dashboard_id, ctx.user_id);

    } catch (const nlohmann::json::parse_error& e) {
        throw DataVizError(ErrorCode::BAD_REQUEST, "Invalid JSON format", e.what(), 400);
    } catch (const pqxx::sql_error& e) {
        LOG_ERROR("Database error updating dashboard: {}", e.what());
        throw DataVizError(ErrorCode::DB_ERROR, "Failed to update dashboard", e.what(), 500);
    }
    return res;
}

crow::response DashboardHandler::handleDeleteDashboard(const crow::request& req, const std::string& dashboard_id, AuthMiddleware::context& ctx) {
    crow::response res;
    try {
        auto conn = DBManager::getInstance().getConnection();
        pqxx::work txn(*conn);

        pqxx::result r = txn.exec_params(SQLQueries::DELETE_DASHBOARD, pqxx::uuid_string(dashboard_id), pqxx::uuid_string(ctx.user_id));
        txn.commit();

        if (r.empty()) {
            throw DataVizError(ErrorCode::NOT_FOUND, "Dashboard not found or unauthorized to delete", "", 404);
        }

        res.code = 204; // No Content
        LOG_INFO("Dashboard ID {} deleted by user {}.", dashboard_id, ctx.user_id);
    } catch (const pqxx::sql_error& e) {
        LOG_ERROR("Database error deleting dashboard: {}", e.what());
        throw DataVizError(ErrorCode::DB_ERROR, "Failed to delete dashboard", e.what(), 500);
    }
    return res;
}

} // namespace DataVizPro
```