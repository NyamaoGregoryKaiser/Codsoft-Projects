#include "DatasetHandler.h"
#include "utils/Logger.h"
#include "common/Error.h"
#include <nlohmann/json.hpp>

namespace DataVizPro {

DatasetHandler::DatasetHandler() {}

void DatasetHandler::registerRoutes(crow::App<AuthMiddleware, ErrorMiddleware>& app) {
    CROW_ROUTE(app, Constants::API_VERSION + "/datasets").methods("POST"_method)(
        [&](const crow::request& req, AuthMiddleware::context& ctx) {
            return handleUploadDataset(req, ctx);
        }
    );

    CROW_ROUTE(app, Constants::API_VERSION + "/datasets/<string>").methods("GET"_method)(
        [&](const crow::request& req, const std::string& dataset_id, AuthMiddleware::context& ctx) {
            return handleGetDataset(req, dataset_id, ctx);
        }
    );

    CROW_ROUTE(app, Constants::API_VERSION + "/datasets").methods("GET"_method)(
        [&](const crow::request& req, AuthMiddleware::context& ctx) {
            return handleGetAllDatasets(req, ctx);
        }
    );

    CROW_ROUTE(app, Constants::API_VERSION + "/datasets/<string>").methods("PUT"_method)(
        [&](const crow::request& req, const std::string& dataset_id, AuthMiddleware::context& ctx) {
            return handleUpdateDataset(req, dataset_id, ctx);
        }
    );

    CROW_ROUTE(app, Constants::API_VERSION + "/datasets/<string>").methods("DELETE"_method)(
        [&](const crow::request& req, const std::string& dataset_id, AuthMiddleware::context& ctx) {
            return handleDeleteDataset(req, dataset_id, ctx);
        }
    );

    CROW_ROUTE(app, Constants::API_VERSION + "/datasets/<string>/data").methods("GET"_method)(
        [&](const crow::request& req, const std::string& dataset_id, AuthMiddleware::context& ctx) {
            return handleGetDatasetData(req, dataset_id, ctx);
        }
    );

    LOG_INFO("Dataset routes registered.");
}

crow::response DatasetHandler::handleUploadDataset(const crow::request& req, AuthMiddleware::context& ctx) {
    crow::response res;
    res.set_header("Content-Type", "application/json");
    try {
        nlohmann::json req_body = nlohmann::json::parse(req.body);
        if (!req_body.contains("name") || !req_body.contains("description") ||
            !req_body.contains("fileContent") || !req_body.contains("fileExtension")) {
            throw DataVizError(ErrorCode::BAD_REQUEST, "Missing required fields: name, description, fileContent, fileExtension", "", 400);
        }

        std::string name = req_body["name"].get<std::string>();
        std::string description = req_body["description"].get<std::string>();
        std::string file_content = req_body["fileContent"].get<std::string>();
        std::string file_extension = req_body["fileExtension"].get<std::string>();

        if (name.empty() || file_content.empty() || file_extension.empty()) {
            throw DataVizError(ErrorCode::INVALID_INPUT, "Name, file content, and file extension cannot be empty", "", 400);
        }

        Dataset new_dataset = dataset_service.createDataset(ctx.user_id, name, description, file_content, file_extension);

        res.code = 201; // Created
        res.write(new_dataset.toJson().dump());
    } catch (const nlohmann::json::parse_error& e) {
        throw DataVizError(ErrorCode::BAD_REQUEST, "Invalid JSON format", e.what(), 400);
    }
    return res;
}

crow::response DatasetHandler::handleGetDataset(const crow::request& req, const std::string& dataset_id, AuthMiddleware::context& ctx) {
    crow::response res;
    res.set_header("Content-Type", "application/json");
    try {
        Dataset dataset = dataset_service.getDataset(dataset_id, ctx.user_id);
        res.code = 200;
        res.write(dataset.toJson().dump());
    } catch (const DataVizError& e) {
        throw; // Re-throw to ErrorMiddleware
    }
    return res;
}

crow::response DatasetHandler::handleGetAllDatasets(const crow::request& req, AuthMiddleware::context& ctx) {
    crow::response res;
    res.set_header("Content-Type", "application/json");
    try {
        std::vector<Dataset> datasets = dataset_service.getAllDatasets(ctx.user_id);
        nlohmann::json datasets_json = nlohmann::json::array();
        for (const auto& ds : datasets) {
            datasets_json.push_back(ds.toJson());
        }
        res.code = 200;
        res.write(datasets_json.dump());
    } catch (const DataVizError& e) {
        throw;
    }
    return res;
}

crow::response DatasetHandler::handleUpdateDataset(const crow::request& req, const std::string& dataset_id, AuthMiddleware::context& ctx) {
    crow::response res;
    res.set_header("Content-Type", "application/json");
    try {
        nlohmann::json req_body = nlohmann::json::parse(req.body);
        if (!req_body.contains("name") || !req_body.contains("description")) {
            throw DataVizError(ErrorCode::BAD_REQUEST, "Missing required fields: name, description", "", 400);
        }

        std::string name = req_body["name"].get<std::string>();
        std::string description = req_body["description"].get<std::string>();

        Dataset updated_dataset = dataset_service.updateDataset(dataset_id, ctx.user_id, name, description);
        res.code = 200;
        res.write(updated_dataset.toJson().dump());
    } catch (const nlohmann::json::parse_error& e) {
        throw DataVizError(ErrorCode::BAD_REQUEST, "Invalid JSON format", e.what(), 400);
    } catch (const DataVizError& e) {
        throw;
    }
    return res;
}

crow::response DatasetHandler::handleDeleteDataset(const crow::request& req, const std::string& dataset_id, AuthMiddleware::context& ctx) {
    crow::response res;
    try {
        dataset_service.deleteDataset(dataset_id, ctx.user_id);
        res.code = 204; // No Content
    } catch (const DataVizError& e) {
        throw;
    }
    return res;
}

crow::response DatasetHandler::handleGetDatasetData(const crow::request& req, const std::string& dataset_id, AuthMiddleware::context& ctx) {
    crow::response res;
    res.set_header("Content-Type", "application/json");
    try {
        int limit = 100; // Default limit
        if (req.url_params.get("limit")) {
            limit = std::stoi(req.url_params.get("limit"));
        }
        
        nlohmann::json data_sample = dataset_service.getDatasetSampleData(dataset_id, ctx.user_id, limit);
        res.code = 200;
        res.write(data_sample.dump());
    } catch (const std::invalid_argument& e) {
        throw DataVizError(ErrorCode::BAD_REQUEST, "Invalid 'limit' parameter", e.what(), 400);
    } catch (const DataVizError& e) {
        throw;
    }
    return res;
}


} // namespace DataVizPro
```