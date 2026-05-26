#pragma once

#include <crow.h>
#include "middleware/AuthMiddleware.h"
#include "services/DatasetService.h"
#include "common/Constants.h"

namespace DataVizPro {

class DatasetHandler {
public:
    DatasetHandler();

    void registerRoutes(crow::App<AuthMiddleware, ErrorMiddleware>& app);

private:
    DatasetService dataset_service;

    crow::response handleUploadDataset(const crow::request& req, AuthMiddleware::context& ctx);
    crow::response handleGetDataset(const crow::request& req, const std::string& dataset_id, AuthMiddleware::context& ctx);
    crow::response handleGetAllDatasets(const crow::request& req, AuthMiddleware::context& ctx);
    crow::response handleUpdateDataset(const crow::request& req, const std::string& dataset_id, AuthMiddleware::context& ctx);
    crow::response handleDeleteDataset(const crow::request& req, const std::string& dataset_id, AuthMiddleware::context& ctx);
    crow::response handleGetDatasetData(const crow::request& req, const std::string& dataset_id, AuthMiddleware::context& ctx);
};

} // namespace DataVizPro
```