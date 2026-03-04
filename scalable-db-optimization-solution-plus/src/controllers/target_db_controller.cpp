```cpp
#include "target_db_controller.h"

TargetDbController::TargetDbController(crow::SimpleApp& app,
                                       std::shared_ptr<TargetDbService> target_db_service,
                                       std::shared_ptr<OptimizationEngine> optimization_engine)
    : target_db_service_(target_db_service), optimization_engine_(optimization_engine) {
    setup_routes(app);
}

void TargetDbController::setup_routes(crow::SimpleApp& app) {

    // Helper to get user_id from context
    auto get_user_id = [](const crow::context& ctx) {
        if (!ctx.has<long>(AUTHORIZED_USER_ID_KEY)) {
            throw UnauthorizedException("User ID not found in context. Authentication middleware missing or failed.");
        }
        return ctx.get<long>(AUTHORIZED_USER_ID_KEY);
    };

    // --- CRUD for Target Databases ---

    CROW_ROUTE(app, "/targets").methods("POST"_method)
    ([this, get_user_id](const crow::request& req) {
        try {
            long user_id = get_user_id(req.ctx);
            auto json_body = crow::json::load(req.body);
            if (!json_body || !json_body.has("name") || !json_body.has("host") || !json_body.has("port") ||
                !json_body.has("db_name") || !json_body.has("db_user") || !json_body.has("db_password")) {
                throw BadRequestException("Missing required fields for target database creation.");
            }

            TargetDB new_db = target_db_service_->create_target_db(
                user_id,
                json_body["name"].s(),
                json_body["host"].s(),
                json_body["port"].s(),
                json_body["db_name"].s(),
                json_body["db_user"].s(),
                json_body["db_password"].s()
            );
            crow::response res(crow::CREATED, new_db.to_json().dump());
            res.set_header("Content-Type", "application/json");
            return res;
        } catch (const BadRequestException& e) {
            return crow::response(crow::BAD_REQUEST, to_json({{"error", e.what()}}).dump());
        } catch (const UnauthorizedException& e) {
            return crow::response(crow::UNAUTHORIZED, to_json({{"error", e.what()}}).dump());
        } catch (const DatabaseConnectionException& e) {
            return crow::response(crow::BAD_GATEWAY, to_json({{"error", "Could not connect to target database: " + std::string(e.what())}}).dump());
        } catch (const DatabaseException& e) {
            LOG_ERROR("Database error in /targets POST: {}", e.what());
            return crow::response(crow::INTERNAL_SERVER_ERROR, to_json({{"error", "Database error."}}).dump());
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception in /targets POST: {}", e.what());
            return crow::response(crow::INTERNAL_SERVER_ERROR, to_json({{"error", "Internal server error."}}).dump());
        }
    });

    CROW_ROUTE(app, "/targets").methods("GET"_method)
    ([this, get_user_id](const crow::request& req) {
        try {
            long user_id = get_user_id(req.ctx);
            std::vector<TargetDB> dbs = target_db_service_->get_all_target_dbs(user_id);
            nlohmann::json json_array = nlohmann::json::array();
            for (const auto& db : dbs) {
                json_array.push_back(db.to_json());
            }
            crow::response res(crow::OK, json_array.dump());
            res.set_header("Content-Type", "application/json");
            return res;
        } catch (const UnauthorizedException& e) {
            return crow::response(crow::UNAUTHORIZED, to_json({{"error", e.what()}}).dump());
        } catch (const DatabaseException& e) {
            LOG_ERROR("Database error in /targets GET: {}", e.what());
            return crow::response(crow::INTERNAL_SERVER_ERROR, to_json({{"error", "Database error."}}).dump());
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception in /targets GET: {}", e.what());
            return crow::response(crow::INTERNAL_SERVER_ERROR, to_json({{"error", "Internal server error."}}).dump());
        }
    });

    CROW_ROUTE(app, "/targets/<int>").methods("GET"_method)
    ([this, get_user_id](long target_db_id, const crow::request& req) {
        try {
            long user_id = get_user_id(req.ctx);
            auto db_opt = target_db_service_->get_target_db_by_id(target_db_id, user_id);
            if (!db_opt.has_value()) {
                throw NotFoundException("Target database not found or user unauthorized.");
            }
            crow::response res(crow::OK, db_opt->to_json().dump());
            res.set_header("Content-Type", "application/json");
            return res;
        } catch (const NotFoundException& e) {
            return crow::response(crow::NOT_FOUND, to_json({{"error", e.what()}}).dump());
        } catch (const UnauthorizedException& e) {
            return crow::response(crow::UNAUTHORIZED, to_json({{"error", e.what()}}).dump());
        } catch (const DatabaseException& e) {
            LOG_ERROR("Database error in /targets/{} GET: {}", target_db_id, e.what());
            return crow::response(crow::INTERNAL_SERVER_ERROR, to_json({{"error", "Database error."}}).dump());
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception in /targets/{} GET: {}", target_db_id, e.what());
            return crow::response(crow::INTERNAL_SERVER_ERROR, to_json({{"error", "Internal server error."}}).dump());
        }
    });

    CROW_ROUTE(app, "/targets/<int>").methods("PUT"_method)
    ([this, get_user_id](long target_db_id, const crow::request& req) {
        try {
            long user_id = get_user_id(req.ctx);
            auto json_body = crow::json::load(req.body);
            if (!json_body || !json_body.has("name") || !json_body.has("host") || !json_body.has("port") ||
                !json_body.has("db_name") || !json_body.has("db_user") || !json_body.has("db_password")) {
                throw BadRequestException("Missing required fields for target database update.");
            }
            // Status and last_error can be managed internally or updated explicitly. For now, pull from JSON or default.
            std::string status_str = json_body.has("status") ? json_body["status"].s() : target_db_status_to_string(TargetDBStatus::ACTIVE);
            std::string last_error = json_body.has("last_error") ? json_body["last_error"].s() : "";

            TargetDB updated_db = target_db_service_->update_target_db(
                target_db_id,
                user_id,
                json_body["name"].s(),
                json_body["host"].s(),
                json_body["port"].s(),
                json_body["db_name"].s(),
                json_body["db_user"].s(),
                json_body["db_password"].s(),
                string_to_target_db_status(status_str),
                last_error
            );
            crow::response res(crow::OK, updated_db.to_json().dump());
            res.set_header("Content-Type", "application/json");
            return res;
        } catch (const BadRequestException& e) {
            return crow::response(crow::BAD_REQUEST, to_json({{"error", e.what()}}).dump());
        } catch (const NotFoundException& e) {
            return crow::response(crow::NOT_FOUND, to_json({{"error", e.what()}}).dump());
        } catch (const UnauthorizedException& e) {
            return crow::response(crow::UNAUTHORIZED, to_json({{"error", e.what()}}).dump());
        } catch (const DatabaseException& e) {
            LOG_ERROR("Database error in /targets/{} PUT: {}", target_db_id, e.what());
            return crow::response(crow::INTERNAL_SERVER_ERROR, to_json({{"error", "Database error."}}).dump());
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception in /targets/{} PUT: {}", target_db_id, e.what());
            return crow::response(crow::INTERNAL_SERVER_ERROR, to_json({{"error", "Internal server error."}}).dump());
        }
    });

    CROW_ROUTE(app, "/targets/<int>").methods("DELETE"_method)
    ([this, get_user_id](long target_db_id, const crow::request& req) {
        try {
            long user_id = get_user_id(req.ctx);
            target_db_service_->delete_target_db(target_db_id, user_id);
            crow::response res(crow::NO_CONTENT); // 204 No Content for successful deletion
            return res;
        } catch (const NotFoundException& e) {
            return crow::response(crow::NOT_FOUND, to_json({{"error", e.what()}}).dump());
        } catch (const UnauthorizedException& e) {
            return crow::response(crow::UNAUTHORIZED, to_json({{"error", e.what()}}).dump());
        } catch (const DatabaseException& e) {
            LOG_ERROR("Database error in /targets/{} DELETE: {}", target_db_id, e.what());
            return crow::response(crow::INTERNAL_SERVER_ERROR, to_json({{"error", "Database error."}}).dump());
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception in /targets/{} DELETE: {}", target_db_id, e.what());
            return crow::response(crow::INTERNAL_SERVER_ERROR, to_json({{"error", "Internal server error."}}).dump());
        }
    });

    // --- Target DB Operations ---

    CROW_ROUTE(app, "/targets/<int>/test-connection").methods("GET"_method)
    ([this, get_user_id](long target_db_id, const crow::request& req) {
        try {
            long user_id = get_user_id(req.ctx);
            auto db_opt = target_db_service_->get_target_db_by_id(target_db_id, user_id);
            if (!db_opt.has_value()) {
                throw NotFoundException("Target database not found or user unauthorized.");
            }

            target_db_service_->test_target_db_connection(db_opt.value());
            crow::response res(crow::OK, to_json({{"message", "Connection successful."}}).dump());
            res.set_header("Content-Type", "application/json");
            return res;
        } catch (const NotFoundException& e) {
            return crow::response(crow::NOT_FOUND, to_json({{"error", e.what()}}).dump());
        } catch (const UnauthorizedException& e) {
            return crow::response(crow::UNAUTHORIZED, to_json({{"error", e.what()}}).dump());
        } catch (const DatabaseConnectionException& e) {
            return crow::response(crow::BAD_GATEWAY, to_json({{"error", "Connection failed: " + std::string(e.what())}}).dump());
        } catch (const DatabaseException& e) {
            LOG_ERROR("Database error during connection test for /targets/{}/test-connection: {}", target_db_id, e.what());
            return crow::response(crow::INTERNAL_SERVER_ERROR, to_json({{"error", "Database error during connection test."}}).dump());
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception in /targets/{}/test-connection: {}", target_db_id, e.what());
            return crow::response(crow::INTERNAL_SERVER_ERROR, to_json({{"error", "Internal server error during connection test."}}).dump());
        }
    });

    CROW_ROUTE(app, "/targets/<int>/analyze").methods("POST"_method)
    ([this, get_user_id](long target_db_id, const crow::request& req) {
        try {
            long user_id = get_user_id(req.ctx);
            // Kicking off an analysis could be a long-running task.
            // In a production system, this would typically enqueue a background job.
            // For this example, we'll run it synchronously.
            std::vector<Recommendation> recommendations = optimization_engine_->analyze_and_recommend(target_db_id, user_id);

            nlohmann::json json_array = nlohmann::json::array();
            for (const auto& rec : recommendations) {
                json_array.push_back(rec.to_json());
            }

            crow::response res(crow::OK, to_json({
                {"message", "Analysis completed. New recommendations generated and stored."},
                {"recommendations", json_array}
            }).dump());
            res.set_header("Content-Type", "application/json");
            return res;
        } catch (const NotFoundException& e) {
            return crow::response(crow::NOT_FOUND, to_json({{"error", e.what()}}).dump());
        } catch (const UnauthorizedException& e) {
            return crow::response(crow::UNAUTHORIZED, to_json({{"error", e.what()}}).dump());
        } catch (const DatabaseConnectionException& e) {
            return crow::response(crow::BAD_GATEWAY, to_json({{"error", "Could not connect to target database for analysis: " + std::string(e.what())}}).dump());
        } catch (const DatabaseException& e) {
            LOG_ERROR("Database error during analysis for /targets/{}/analyze: {}", target_db_id, e.what());
            return crow::response(crow::INTERNAL_SERVER_ERROR, to_json({{"error", "Database error during analysis."}}).dump());
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception in /targets/{}/analyze: {}", target_db_id, e.what());
            return crow::response(crow::INTERNAL_SERVER_ERROR, to_json({{"error", "Internal server error during analysis."}}).dump());
        }
    });

    CROW_ROUTE(app, "/targets/<int>/metrics").methods("GET"_method)
    ([this, get_user_id](long target_db_id, const crow::request& req) {
        try {
            long user_id = get_user_id(req.ctx);
            auto db_opt = target_db_service_->get_target_db_by_id(target_db_id, user_id);
            if (!db_opt.has_value()) {
                throw NotFoundException("Target database not found or user unauthorized.");
            }

            int limit = 100; // Default limit
            if (req.url_params.get("limit")) {
                limit = std::stoi(req.url_params.get("limit"));
            }

            std::vector<QueryMetric> metrics = target_db_service_->get_query_metrics_for_target_db(target_db_id, limit);

            nlohmann::json json_array = nlohmann::json::array();
            for (const auto& metric : metrics) {
                json_array.push_back(metric.to_json());
            }
            crow::response res(crow::OK, json_array.dump());
            res.set_header("Content-Type", "application/json");
            return res;
        } catch (const BadRequestException& e) {
            return crow::response(crow::BAD_REQUEST, to_json({{"error", e.what()}}).dump());
        } catch (const NotFoundException& e) {
            return crow::response(crow::NOT_FOUND, to_json({{"error", e.what()}}).dump());
        } catch (const UnauthorizedException& e) {
            return crow::response(crow::UNAUTHORIZED, to_json({{"error", e.what()}}).dump());
        } catch (const DatabaseException& e) {
            LOG_ERROR("Database error in /targets/{}/metrics GET: {}", target_db_id, e.what());
            return crow::response(crow::INTERNAL_SERVER_ERROR, to_json({{"error", "Database error fetching metrics."}}).dump());
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception in /targets/{}/metrics GET: {}", target_db_id, e.what());
            return crow::response(crow::INTERNAL_SERVER_ERROR, to_json({{"error", "Internal server error fetching metrics."}}).dump());
        }
    });

    CROW_ROUTE(app, "/targets/<int>/recommendations").methods("GET"_method)
    ([this, get_user_id](long target_db_id, const crow::request& req) {
        try {
            long user_id = get_user_id(req.ctx);
            auto db_opt = target_db_service_->get_target_db_by_id(target_db_id, user_id);
            if (!db_opt.has_value()) {
                throw NotFoundException("Target database not found or user unauthorized.");
            }

            bool include_applied = false;
            if (req.url_params.get("include_applied") && std::string(req.url_params.get("include_applied")) == "true") {
                include_applied = true;
            }

            std::vector<Recommendation> recommendations = optimization_engine_->get_recommendations_for_target_db(target_db_id, include_applied);

            nlohmann::json json_array = nlohmann::json::array();
            for (const auto& rec : recommendations) {
                json_array.push_back(rec.to_json());
            }
            crow::response res(crow::OK, json_array.dump());
            res.set_header("Content-Type", "application/json");
            return res;
        } catch (const NotFoundException& e) {
            return crow::response(crow::NOT_FOUND, to_json({{"error", e.what()}}).dump());
        } catch (const UnauthorizedException& e) {
            return crow::response(crow::UNAUTHORIZED, to_json({{"error", e.what()}}).dump());
        } catch (const DatabaseException& e) {
            LOG_ERROR("Database error in /targets/{}/recommendations GET: {}", target_db_id, e.what());
            return crow::response(crow::INTERNAL_SERVER_ERROR, to_json({{"error", "Database error fetching recommendations."}}).dump());
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception in /targets/{}/recommendations GET: {}", target_db_id, e.what());
            return crow::response(crow::INTERNAL_SERVER_ERROR, to_json({{"error", "Internal server error fetching recommendations."}}).dump());
        }
    });
}
```