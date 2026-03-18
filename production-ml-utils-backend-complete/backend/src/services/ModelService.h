#pragma once

#include "models/Model.h"
#include <vector>
#include <string>
#include <optional>

class ModelService {
public:
    ModelService() = default;

    Model createModel(const Model& model);
    std::optional<Model> getModelById(const std::string& id, const std::string& user_id);
    std::vector<Model> listModels(const std::string& user_id);
    Model updateModel(const std::string& id, const std::string& user_id, const Model& updated_model_data);
    void deleteModel(const std::string& id, const std::string& user_id);
};
```