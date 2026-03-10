```cpp
#pragma once

#include <string>
#include <memory>
#include <unordered_map>
#include <mutex>
#include <stdexcept>
#include "Model.h"
#include "Cache.h"
#include "../database/DatabaseManager.h"
#include "../utils/Types.h"
#include "../utils/Logger.h"

namespace mlops {
namespace core {

class PredictionService {
public:
    PredictionService(std::shared_ptr<database::DatabaseManager> db_manager, size_t cache_capacity);

    PredictionOutput predict(int model_id, int version_id, const PredictionInput& input);
    PredictionOutput predictByVersionTag(int model_id, const std::string& version_tag, const PredictionInput& input);

    // Reloads a specific model version from DB and updates cache
    void reloadModelVersion(int version_id);

private:
    std::shared_ptr<database::DatabaseManager> db_manager_;
    ModelVersionCache model_version_cache_;

    // In-memory store for loaded BaseModel objects.
    // Key: model_version_id
    // This is distinct from model_version_cache_ which stores DTOs (metadata).
    // This stores the actual, runnable model instances.
    std::unordered_map<int, std::shared_ptr<BaseModel>> loaded_models_;
    std::mutex loaded_models_mtx_; // Mutex for loaded_models_
    
    std::shared_ptr<BaseModel> getLoadedModel(int model_version_id, const ModelVersionDTO& version_dto);
};

} // namespace core
} // namespace mlops
```