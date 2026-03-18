#pragma once

#include "crow.h"
#include "services/ModelService.h"
#include "middleware/AuthMiddleware.h"

class ModelController {
private:
    static ModelService model_service;

public:
    ModelController() = delete;

    static void createModel(const crow::request& req, crow::response& res);
    static void listModels(const crow::request& req, crow::response& res);
    static void getModelById(const crow::request& req, crow::response& res, const std::string& model_id);
    static void updateModel(const crow::request& req, crow::response& res, const std::string& model_id);
    static void deleteModel(const crow::request& req, crow::response& res, const std::string& model_id);
};
```