#include "UserHandler.h"
#include "utils/Logger.h"
#include "common/Error.h"
#include "db/DBManager.h"
#include "db/SQLQueries.h"
#include <nlohmann/json.hpp>

namespace DataVizPro {

UserHandler::UserHandler() {}

void UserHandler::registerRoutes(crow::App<AuthMiddleware, ErrorMiddleware>& app) {
    CROW_ROUTE(app, Constants::API_VERSION + "/auth/register").methods("POST"_method)(
        [&](const crow::request& req) {
            return handleRegister(req);
        }
    );

    CROW_ROUTE(app, Constants::API_VERSION + "/auth/login").methods("POST"_method)(
        [&](const crow::request& req) {
            return handleLogin(req);
        }
    );

    CROW_ROUTE(app, Constants::API_VERSION + "/users/me").methods("GET"_method)(
        [&](const crow::request& req, AuthMiddleware::context& ctx) {
            return handleGetUserProfile(req, ctx);
        }
    );

    LOG_INFO("User routes registered.");
}

crow::response UserHandler::handleRegister(const crow::request& req) {
    crow::response res;
    res.set_header("Content-Type", "application/json");
    try {
        nlohmann::json req_body = nlohmann::json::parse(req.body);
        if (!req_body.contains("username") || !req_body.contains("email") || !req_body.contains("password")) {
            throw DataVizError(ErrorCode::BAD_REQUEST, "Missing username, email, or password", "", 400);
        }

        std::string username = req_body["username"].get<std::string>();
        std::string email = req_body["email"].get<std::string>();
        std::string password = req_body["password"].get<std::string>();

        // Basic validation
        if (username.empty() || email.empty() || password.empty()) {
            throw DataVizError(ErrorCode::INVALID_INPUT, "Username, email, and password cannot be empty", "", 400);
        }
        if (password.length() < 8) {
            throw DataVizError(ErrorCode::INVALID_INPUT, "Password must be at least 8 characters long", "", 400);
        }

        User new_user = auth_manager.registerUser(username, email, password);
        res.code = 201; // Created
        res.write(new_user.toJson().dump());
    } catch (const nlohmann::json::parse_error& e) {
        throw DataVizError(ErrorCode::BAD_REQUEST, "Invalid JSON format", e.what(), 400);
    }
    return res;
}

crow::response UserHandler::handleLogin(const crow::request& req) {
    crow::response res;
    res.set_header("Content-Type", "application/json");
    try {
        nlohmann::json req_body = nlohmann::json::parse(req.body);
        if (!req_body.contains("username") || !req_body.contains("password")) {
            throw DataVizError(ErrorCode::BAD_REQUEST, "Missing username or password", "", 400);
        }

        std::string username = req_body["username"].get<std::string>();
        std::string password = req_body["password"].get<std::string>();

        if (username.empty() || password.empty()) {
            throw DataVizError(ErrorCode::INVALID_INPUT, "Username and password cannot be empty", "", 400);
        }

        std::string token = auth_manager.loginUser(username, password);

        nlohmann::json response_body;
        response_body["token"] = token;
        res.code = 200;
        res.write(response_body.dump());
    } catch (const nlohmann::json::parse_error& e) {
        throw DataVizError(ErrorCode::BAD_REQUEST, "Invalid JSON format", e.what(), 400);
    }
    return res;
}

crow::response UserHandler::handleGetUserProfile(const crow::request& req, AuthMiddleware::context& ctx) {
    crow::response res;
    res.set_header("Content-Type", "application/json");
    try {
        auto conn = DBManager::getInstance().getConnection();
        pqxx::nontransaction N(*conn);
        pqxx::result r = N.exec_params(SQLQueries::SELECT_USER_BY_ID, ctx.user_id);

        if (r.empty()) {
            LOG_ERROR("Authenticated user ID {} not found in DB.", ctx.user_id);
            throw DataVizError(ErrorCode::NOT_FOUND, "User profile not found", "", 404);
        }

        User user_profile;
        user_profile.id = r[0]["id"].as<std::string>();
        user_profile.username = r[0]["username"].as<std::string>();
        user_profile.email = r[0]["email"].as<std::string>();

        res.code = 200;
        res.write(user_profile.toJson().dump());
    } catch (const pqxx::sql_error& e) {
        LOG_ERROR("Database error fetching user profile: {}", e.what());
        throw DataVizError(ErrorCode::DB_ERROR, "Failed to retrieve user profile", e.what(), 500);
    }
    return res;
}

} // namespace DataVizPro
```