```cpp
#include "Server.h"
#include "../exceptions/AppException.h"
#include "nlohmann/json.hpp"
#include <chrono> // For parsing time points

namespace PerfoMetrics {

Server::Server(int port) : port(port) {
    // Configure CORS for development
    app.set_cors()
        .global()
        .origins("http://localhost:3000", "http://localhost:80", "http://perfo.metrics") // Adjust as needed for production
        .methods("POST", "GET", "PUT", "DELETE", "OPTIONS")
        .headers("Authorization", "Content-Type", "x-api-key")
        .max_age(3600);

    setup_routes();
    Logger::get_logger()->info("PerfoMetrics API Server initialized on port {}", port);
}

void Server::run() {
    app.port(port).multithreaded().run();
}

void Server::handle_exception(crow::response& res, const AppException& e) {
    Logger::get_logger()->error("AppException caught: {} (Code: {})", e.what(), e.get_error_code());
    res.code = e.get_http_status();
    res.write(nlohmann::json({{"error", e.what()}, {"code", e.get_error_code()}}).dump());
    res.end();
}

void Server::handle_exception(crow::response& res, const std::exception& e) {
    Logger::get_logger()->error("Unhandled exception caught: {}", e.what());
    res.code = 500;
    res.write(nlohmann::json({{"error", "Internal server error"}, {"details", e.what()}}).dump());
    res.end();
}

void Server::setup_routes() {
    // Public routes (no authentication)
    CROW_ROUTE(app, "/")([](){
        return "Welcome to PerfoMetrics API!";
    });

    CROW_ROUTE(app, "/auth/login")
        .methods("POST"_method)
        ([this](const crow::request& req) {
        crow::response res;
        try {
            auto json_body = nlohmann::json::parse(req.body);
            LoginRequestDTO login_req = json_body.get<LoginRequestDTO>();
            LoginResponseDTO login_res = auth_service.login_user(login_req);
            res.code = 200;
            res.write(nlohmann::json(login_res).dump());
        } catch (const nlohmann::json::exception& e) {
            Logger::get_logger()->warn("Invalid JSON for login: {}", e.what());
            res.code = 400;
            res.write({"error", "Invalid JSON format."}.dump());
        } catch (const AppException& e) {
            handle_exception(res, e);
        } catch (const std::exception& e) {
            handle_exception(res, e);
        }
        res.end();
    });

    // Authenticated routes (require JWT)
    // Create new service (Admin only)
    CROW_ROUTE(app, "/services")
        .methods("POST"_method)
        .template middleware<PerfoMetrics::AuthMiddleware>() // Apply AuthMiddleware
        ([this](const crow::request& req, crow::response& res) {
        try {
            const auto& user_context = req.get_context<PerfoMetrics::AuthMiddleware>().authenticated_user;
            if (!user_context || user_context->role != "admin") {
                throw AppException(AppException::FORBIDDEN, "Access denied. Admin role required.");
            }

            auto json_body = nlohmann::json::parse(req.body);
            CreateServiceRequestDTO create_req = json_body.get<CreateServiceRequestDTO>();
            ServiceResponseDTO service_res = metric_service.create_service(create_req);
            res.code = 201; // Created
            res.write(nlohmann::json(service_res).dump());
        } catch (const nlohmann::json::exception& e) {
            Logger::get_logger()->warn("Invalid JSON for create service: {}", e.what());
            res.code = 400;
            res.write({"error", "Invalid JSON format."}.dump());
        } catch (const AppException& e) {
            handle_exception(res, e);
        } catch (const std::exception& e) {
            handle_exception(res, e);
        }
        res.end();
    });

    // Get all services (Admin/Viewer)
    CROW_ROUTE(app, "/services")
        .methods("GET"_method)
        .template middleware<PerfoMetrics::AuthMiddleware>()
        ([this](const crow::request& req, crow::response& res) {
        try {
            const auto& user_context = req.get_context<PerfoMetrics::AuthMiddleware>().authenticated_user;
            if (!user_context) { // Should be caught by middleware, but defensive
                throw AppException(AppException::UNAUTHORIZED, "Authentication required.");
            }
            // Allow both admin and viewer to list services
            std::vector<ServiceResponseDTO> services = metric_service.get_all_services();
            res.code = 200;
            res.write(nlohmann::json(services).dump());
        } catch (const AppException& e) {
            handle_exception(res, e);
        } catch (const std::exception& e) {
            handle_exception(res, e);
        }
        res.end();
    });

    // Ingest metrics for a service (requires service API key or admin JWT)
    CROW_ROUTE(app, "/metrics")
        .methods("POST"_method)
        .template middleware<PerfoMetrics::RateLimitMiddleware>() // Apply rate limiting
        ([this](const crow::request& req, crow::response& res) {
        try {
            std::string api_key = req.get_header("X-API-KEY");
            if (api_key.empty()) {
                res.code = 400;
                res.write({"error", "X-API-KEY header is required for metric ingestion."}.dump());
                res.end();
                return;
            }

            auto service_opt = metric_service.get_service_by_api_key(api_key);
            if (!service_opt) {
                res.code = 403; // Forbidden if API key is invalid
                res.write({"error", "Invalid X-API-KEY."}.dump());
                res.end();
                return;
            }

            int service_id = service_opt->id;
            auto json_body = nlohmann::json::parse(req.body);

            if (json_body.is_array()) { // Batch ingestion
                BatchMetricIngestDTO batch_dto = json_body.get<BatchMetricIngestDTO>();
                metric_service.ingest_batch_metrics(service_id, batch_dto);
            } else if (json_body.is_object()) { // Single metric ingestion
                MetricIngestDTO single_dto = json_body.get<MetricIngestDTO>();
                metric_service.ingest_metric(service_id, single_dto);
            } else {
                throw AppException(AppException::INVALID_INPUT, "Request body must be a JSON object for single metric or an array for batch metrics.");
            }

            res.code = 202; // Accepted
            res.write({"message", "Metrics ingested successfully."}.dump());
        } catch (const nlohmann::json::exception& e) {
            Logger::get_logger()->warn("Invalid JSON for metric ingestion: {}", e.what());
            res.code = 400;
            res.write({"error", "Invalid JSON format for metrics."}.dump());
        } catch (const AppException& e) {
            handle_exception(res, e);
        } catch (const std::exception& e) {
            handle_exception(res, e);
        }
        res.end();
    });

    // Query metrics for a specific service (Viewer/Admin)
    CROW_ROUTE(app, "/metrics/<int>") // service_id as path param
        .methods("GET"_method)
        .template middleware<PerfoMetrics::AuthMiddleware>()
        ([this](const crow::request& req, crow::response& res, int service_id) {
        try {
            const auto& user_context = req.get_context<PerfoMetrics::AuthMiddleware>().authenticated_user;
            if (!user_context) {
                throw AppException(AppException::UNAUTHORIZED, "Authentication required.");
            }
            // All authenticated users can view metrics for services they have access to
            // (For simplicity, we assume any authenticated user can view any service's metrics here.
            // In a real app, you'd add authorization rules per service/user role.)
            if (!metric_service.get_service_by_id(service_id)) {
                throw AppException(AppException::NOT_FOUND, "Service not found.");
            }

            std::optional<std::string> metric_type_filter;
            if (req.url_params.get("metric_type")) {
                metric_type_filter = req.url_params.get("metric_type");
            }

            std::optional<std::chrono::system_clock::time_point> start_time;
            if (req.url_params.get("start_time")) {
                // Example: "2023-01-01T00:00:00Z"
                std::string ts_str = req.url_params.get("start_time");
                std::istringstream ss(ts_str);
                std::tm t{};
                ss >> std::get_time(&t, "%Y-%m-%dT%H:%M:%SZ");
                if (ss.fail()) throw AppException(AppException::INVALID_INPUT, "Invalid start_time format.");
                start_time = std::chrono::system_clock::from_time_t(std::mktime(&t));
            }

            std::optional<std::chrono::system_clock::time_point> end_time;
            if (req.url_params.get("end_time")) {
                std::string ts_str = req.url_params.get("end_time");
                std::istringstream ss(ts_str);
                std::tm t{};
                ss >> std::get_time(&t, "%Y-%m-%dT%H:%M:%SZ");
                if (ss.fail()) throw AppException(AppException::INVALID_INPUT, "Invalid end_time format.");
                end_time = std::chrono::system_clock::from_time_t(std::mktime(&t));
            }

            int limit = req.url_params.get("limit") ? std::stoi(req.url_params.get("limit")) : 100;
            int offset = req.url_params.get("offset") ? std::stoi(req.url_params.get("offset")) : 0;

            if (limit <= 0 || offset < 0) {
                throw AppException(AppException::INVALID_INPUT, "Limit must be positive, offset non-negative.");
            }

            std::vector<MetricResponseDTO> metrics = metric_service.get_metrics_for_service(
                service_id, metric_type_filter, start_time, end_time, limit, offset
            );

            res.code = 200;
            res.write(nlohmann::json(metrics).dump());
        } catch (const std::invalid_argument& e) {
            handle_exception(res, AppException(AppException::INVALID_INPUT, std::string("Invalid query parameter format: ") + e.what()));
        } catch (const AppException& e) {
            handle_exception(res, e);
        } catch (const std::exception& e) {
            handle_exception(res, e);
        }
        res.end();
    });

    // TODO: Add AlertingService routes here (create, list, update alert rules)
    // CROW_ROUTE(app, "/alerts/rules") ...
}

} // namespace PerfoMetrics
```