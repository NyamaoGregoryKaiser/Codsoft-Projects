```cpp
#include "MetricService.h"
#include "../exceptions/AppException.h"
#include <random>
#include <sstream>
#include <iomanip> // For std::put_time

// Helper for UUID generation
#include <boost/uuid/uuid.hpp>            // uuid class
#include <boost/uuid/uuid_generators.hpp> // generators
#include <boost/uuid/uuid_io.hpp>         // streaming operators etc.

// Chrono to string conversion
std::string to_iso_string(const std::chrono::system_clock::time_point& tp) {
    auto in_time_t = std::chrono::system_clock::to_time_t(tp);
    std::stringstream ss;
    ss << std::put_time(std::gmtime(&in_time_t), "%Y-%m-%dT%H:%M:%SZ");
    return ss.str();
}

MetricService::MetricService() {
    valid_metric_types = {
        "CPU_USAGE", "MEMORY_USAGE", "REQUEST_LATENCY", "ERROR_RATE", "CUSTOM_METRIC"
    };
    Logger::get_logger()->debug("MetricService initialized with valid metric types.");
}

std::string MetricService::generate_api_key() {
    // Generate a UUID for the API key
    boost::uuids::uuid uuid = boost::uuids::random_generator()();
    std::stringstream ss;
    ss << uuid;
    return ss.str();
}

void MetricService::validate_metric_type(const std::string& metric_type_str) {
    if (valid_metric_types.find(metric_type_str) == valid_metric_types.end()) {
        throw AppException(AppException::METRIC_TYPE_INVALID, "Invalid metric type: " + metric_type_str);
    }
}

ServiceResponseDTO MetricService::create_service(const CreateServiceRequestDTO& request) {
    auto conn = DBManager::get_instance().get_connection();
    pqxx::work txn(*conn);

    try {
        // Check if service name already exists
        pqxx::result existing_service = txn.exec_params(
            "SELECT id FROM services WHERE name = $1", request.name
        );
        if (!existing_service.empty()) {
            throw AppException(AppException::SERVICE_ALREADY_EXISTS, "Service with this name already exists.");
        }

        std::string api_key = generate_api_key();
        pqxx::result r = txn.exec_params(
            "INSERT INTO services (name, description, api_key) VALUES ($1, $2, $3) RETURNING id",
            request.name, request.description, api_key
        );
        txn.commit();

        int service_id = r[0]["id"].as<int>();
        Logger::get_logger()->info("Service '{}' created with ID: {}", request.name, service_id);
        return {service_id, request.name, request.description, api_key};
    } catch (const pqxx::sql_error& e) {
        txn.abort();
        Logger::get_logger()->error("Database error creating service: {}", e.what());
        throw AppException(AppException::DATABASE_ERROR, "Failed to create service.");
    }
}

std::optional<Service> MetricService::get_service_by_api_key(const std::string& api_key) {
    auto conn = DBManager::get_instance().get_connection();
    pqxx::read_transaction txn(*conn);

    try {
        pqxx::result r = txn.exec_params(
            "SELECT id, name, description, api_key FROM services WHERE api_key = $1",
            api_key
        );
        if (!r.empty()) {
            return Service(
                r[0]["id"].as<int>(),
                r[0]["name"].as<std::string>(),
                r[0]["description"].as<std::string>(),
                r[0]["api_key"].as<std::string>()
            );
        }
        return std::nullopt;
    } catch (const pqxx::sql_error& e) {
        Logger::get_logger()->error("Database error fetching service by API key: {}", e.what());
        throw AppException(AppException::DATABASE_ERROR, "Failed to retrieve service by API key.");
    }
}

std::optional<Service> MetricService::get_service_by_id(int service_id) {
    auto conn = DBManager::get_instance().get_connection();
    pqxx::read_transaction txn(*conn);

    try {
        pqxx::result r = txn.exec_params(
            "SELECT id, name, description, api_key FROM services WHERE id = $1",
            service_id
        );
        if (!r.empty()) {
            return Service(
                r[0]["id"].as<int>(),
                r[0]["name"].as<std::string>(),
                r[0]["description"].as<std::string>(),
                r[0]["api_key"].as<std::string>()
            );
        }
        return std::nullopt;
    } catch (const pqxx::sql_error& e) {
        Logger::get_logger()->error("Database error fetching service by ID {}: {}", service_id, e.what());
        throw AppException(AppException::DATABASE_ERROR, "Failed to retrieve service by ID.");
    }
}


std::vector<ServiceResponseDTO> MetricService::get_all_services() {
    auto conn = DBManager::get_instance().get_connection();
    pqxx::read_transaction txn(*conn);

    std::vector<ServiceResponseDTO> services;
    try {
        pqxx::result r = txn.exec("SELECT id, name, description, api_key FROM services ORDER BY name");
        for (const auto& row : r) {
            services.push_back({
                row["id"].as<int>(),
                row["name"].as<std::string>(),
                row["description"].as<std::string>(),
                row["api_key"].as<std::string>()
            });
        }
        return services;
    } catch (const pqxx::sql_error& e) {
        Logger::get_logger()->error("Database error fetching all services: {}", e.what());
        throw AppException(AppException::DATABASE_ERROR, "Failed to retrieve services.");
    }
}


void MetricService::ingest_metric(int service_id, const MetricIngestDTO& dto) {
    validate_metric_type(dto.metric_type);

    auto conn = DBManager::get_instance().get_connection();
    pqxx::work txn(*conn);

    try {
        // Current timestamp for ingestion
        auto now = std::chrono::system_clock::now();
        // Convert nlohmann::json to std::string for JSONB insertion
        std::string tags_json_str = dto.tags.empty() ? "{}" : dto.tags.dump();

        txn.exec_params(
            "INSERT INTO metrics (service_id, timestamp, metric_type, value, tags) VALUES ($1, $2, $3, $4, $5::jsonb)",
            service_id, now, dto.metric_type, dto.value, tags_json_str
        );
        txn.commit();
        Logger::get_logger()->debug("Metric ingested for service {}: type={}, value={}", service_id, dto.metric_type, dto.value);
    } catch (const pqxx::sql_error& e) {
        txn.abort();
        Logger::get_logger()->error("Database error ingesting metric for service {}: {}", service_id, e.what());
        throw AppException(AppException::DATABASE_ERROR, "Failed to ingest metric.");
    }
}

void MetricService::ingest_batch_metrics(int service_id, const BatchMetricIngestDTO& dto) {
    auto conn = DBManager::get_instance().get_connection();
    pqxx::work txn(*conn);

    try {
        for (const auto& metric_dto : dto.metrics) {
            validate_metric_type(metric_dto.metric_type);
            auto now = std::chrono::system_clock::now();
            std::string tags_json_str = metric_dto.tags.empty() ? "{}" : metric_dto.tags.dump();

            txn.exec_params(
                "INSERT INTO metrics (service_id, timestamp, metric_type, value, tags) VALUES ($1, $2, $3, $4, $5::jsonb)",
                service_id, now, metric_dto.metric_type, metric_dto.value, tags_json_str
            );
        }
        txn.commit();
        Logger::get_logger()->info("Ingested {} metrics for service {}", dto.metrics.size(), service_id);
    } catch (const AppException& e) {
        txn.abort();
        throw; // Re-throw specific AppExceptions like METRIC_TYPE_INVALID
    } catch (const pqxx::sql_error& e) {
        txn.abort();
        Logger::get_logger()->error("Database error ingesting batch metrics for service {}: {}", service_id, e.what());
        throw AppException(AppException::DATABASE_ERROR, "Failed to ingest batch metrics.");
    }
}

std::vector<MetricResponseDTO> MetricService::get_metrics_for_service(
    int service_id,
    const std::optional<std::string>& metric_type_filter,
    const std::optional<std::chrono::system_clock::time_point>& start_time,
    const std::optional<std::chrono::system_clock::time_point>& end_time,
    int limit, int offset
) {
    auto conn = DBManager::get_instance().get_connection();
    pqxx::read_transaction txn(*conn);

    std::vector<MetricResponseDTO> metrics;
    std::stringstream query_ss;
    query_ss << "SELECT id, service_id, timestamp, metric_type, value, tags FROM metrics WHERE service_id = $1";

    std::vector<std::string> params;
    params.push_back(std::to_string(service_id));
    int param_idx = 2; // Start from $2 for dynamic filters

    if (metric_type_filter) {
        validate_metric_type(*metric_type_filter);
        query_ss << " AND metric_type = $" << param_idx++;
        params.push_back(*metric_type_filter);
    }
    if (start_time) {
        query_ss << " AND timestamp >= $" << param_idx++;
        params.push_back(to_iso_string(*start_time));
    }
    if (end_time) {
        query_ss << " AND timestamp <= $" << param_idx++;
        params.push_back(to_iso_string(*end_time));
    }

    query_ss << " ORDER BY timestamp DESC";
    query_ss << " LIMIT $" << param_idx++;
    params.push_back(std::to_string(limit));

    query_ss << " OFFSET $" << param_idx++;
    params.push_back(std::to_string(offset));

    try {
        pqxx::result r = txn.exec_params(query_ss.str(), pqxx::placeholders(params.size()));

        // Populate placeholders for exec_params
        std::vector<pqxx::param::argument> args;
        for (const auto& p : params) {
            args.emplace_back(p);
        }

        r = txn.exec_params(query_ss.str(), args);

        for (const auto& row : r) {
            MetricResponseDTO dto;
            dto.id = row["id"].as<long>();
            dto.service_id = row["service_id"].as<int>();
            dto.timestamp = to_iso_string(row["timestamp"].as<std::chrono::system_clock::time_point>());
            dto.metric_type = row["metric_type"].as<std::string>();
            dto.value = row["value"].as<double>();
            dto.tags = nlohmann::json::parse(row["tags"].as<std::string>());
            metrics.push_back(dto);
        }
        Logger::get_logger()->debug("Queried {} metrics for service {}", metrics.size(), service_id);
        return metrics;
    } catch (const AppException& e) {
        throw; // Re-throw specific AppExceptions like METRIC_TYPE_INVALID
    } catch (const pqxx::sql_error& e) {
        Logger::get_logger()->error("Database error querying metrics for service {}: {}", service_id, e.what());
        throw AppException(AppException::DATABASE_ERROR, "Failed to retrieve metrics.");
    }
}
```