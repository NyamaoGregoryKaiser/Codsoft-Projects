#pragma once

#include "crow.h"
#include "services/MLTransformService.h"

class MLTransformController {
private:
    static MLTransformService transform_service;

public:
    MLTransformController() = delete;

    static void applyStandardScaler(const crow::request& req, crow::response& res);
    static void applyMinMaxScaler(const crow::request& req, crow::response& res);
    static void mockPrediction(const crow::request& req, crow::response& res, const std::string& model_id);
};
```