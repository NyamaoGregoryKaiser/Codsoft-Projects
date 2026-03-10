```cpp
#include "PredictionService.h"

namespace mlops {
namespace core {

PredictionService::PredictionService(std::shared_ptr<database::DatabaseManager> db_manager, size_t cache_capacity)
    : db_manager_(std::move(db_manager)), model_version_cache_(cache_capacity) {
    if (!db_manager_) {
        throw std::runtime_error("DatabaseManager pointer cannot be null for PredictionService.");
    }
    LOG_INFO("PredictionService initialized.");
}

std::shared_ptr<BaseModel> PredictionService::getLoadedModel(int model_version_id, const ModelVersionDTO& version_dto) {
    std::unique_lock<std::mutex> lock(loaded_models_mtx_);
    auto it = loaded_models_.find(model_version_id);
    if (it != loaded_models_.end()) {
        LOG_DEBUG("Model instance found in runtime cache for version ID: " + std::to_string(model_version_id));
        return it->second;
    }
    lock.unlock(); // Release lock before potentially long-running load operation

    LOG_INFO("Loading model instance for version ID: " + std::to_string(model_version_id));
    // Determine model type from version_dto (e.g., from a 'model_type' field in parameters or ModelDTO)
    // For this example, we'll hardcode to "linear_regression"
    std::string model_type = "linear_regression"; 
    
    auto model = ModelFactory::createModel(model_type);
    if (!model) {
        throw std::runtime_error("Failed to create model instance for type: " + model_type);
    }
    model->load(version_dto.model_path, version_dto.parameters);

    lock.lock(); // Re-acquire lock to insert into map
    loaded_models_[model_version_id] = model;
    LOG_INFO("Model instance loaded and added to runtime cache for version ID: " + std::to_string(model_version_id));
    return model;
}

PredictionOutput PredictionService::predict(int model_id, int version_id, const PredictionInput& input) {
    std::optional<ModelVersionDTO> version_dto_opt = model_version_cache_.get(version_id);

    if (!version_dto_opt) {
        // Not in cache, try to load from DB
        LOG_INFO("Model version " + std::to_string(version_id) + " not in cache, fetching from DB.");
        version_dto_opt = db_manager_->getModelVersionById(version_id);
        if (!version_dto_opt) {
            std::string error_msg = "Model version with ID " + std::to_string(version_id) + " not found.";
            LOG_ERROR(error_msg);
            throw std::runtime_error(error_msg);
        }
        if (!version_dto_opt->is_active) {
            std::string error_msg = "Model version with ID " + std::to_string(version_id) + " is not active.";
            LOG_ERROR(error_msg);
            throw std::runtime_error(error_msg);
        }
        // Put into cache if successfully loaded from DB
        model_version_cache_.put(*version_dto_opt);
    } else {
        // Ensure it's still active. If not, it shouldn't have been returned by active endpoint.
        // Or we should reload it from DB to check status.
        if (!version_dto_opt->is_active) {
             std::string error_msg = "Cached model version with ID " + std::to_string(version_id) + " is inactive.";
             LOG_ERROR(error_msg);
             // Consider removing from cache and throwing, or reloading to get active status
             model_version_cache_.remove(version_id); // Remove stale entry
             throw std::runtime_error(error_msg);
        }
    }

    try {
        std::shared_ptr<BaseModel> model = getLoadedModel(version_id, *version_dto_opt);
        if (!model) {
            throw std::runtime_error("Failed to get loaded model for version ID " + std::to_string(version_id));
        }
        PredictionOutput output = model->predict(input);
        
        // Log prediction
        PredictionLogDTO log_dto;
        log_dto.model_version_id = version_id;
        log_dto.input_data = input;
        log_dto.output_data = output;
        log_dto.status = "SUCCESS";
        db_manager_->createPredictionLog(log_dto);

        LOG_INFO("Prediction successful for model " + std::to_string(model_id) + ", version " + std::to_string(version_id));
        return output;
    } catch (const std::exception& e) {
        // Log prediction error
        PredictionLogDTO log_dto;
        log_dto.model_version_id = version_id;
        log_dto.input_data = input;
        log_dto.output_data = {}; // Empty output on error
        log_dto.status = "ERROR";
        log_dto.error_message = e.what();
        db_manager_->createPredictionLog(log_dto);

        LOG_ERROR("Prediction failed for model " + std::to_string(model_id) + ", version " + std::to_string(version_id) + ": " + e.what());
        throw; // Re-throw to be handled by API error handler
    }
}

PredictionOutput PredictionService::predictByVersionTag(int model_id, const std::string& version_tag, const PredictionInput& input) {
    LOG_INFO("Attempting prediction for model ID " + std::to_string(model_id) + " with version tag: " + version_tag);
    auto version_dto_opt = db_manager_->getModelVersionByModelAndTag(model_id, version_tag);
    if (!version_dto_opt) {
        std::string error_msg = "Model version with tag '" + version_tag + "' for model ID " + std::to_string(model_id) + " not found.";
        LOG_ERROR(error_msg);
        throw std::runtime_error(error_msg);
    }
    if (!version_dto_opt->is_active) {
        std::string error_msg = "Model version with tag '" + version_tag + "' for model ID " + std::to_string(model_id) + " is not active.";
        LOG_ERROR(error_msg);
        throw std::runtime_error(error_msg);
    }
    return predict(model_id, *version_dto_opt->id, input);
}


void PredictionService::reloadModelVersion(int version_id) {
    LOG_INFO("Reloading model version ID: " + std::to_string(version_id));
    // Remove from in-memory model store
    std::lock_guard<std::mutex> lock(loaded_models_mtx_);
    loaded_models_.erase(version_id);
    model_version_cache_.remove(version_id); // Also remove from DTO cache to force reload

    // Next 'predict' call will fetch from DB and re-load the model
    LOG_INFO("Model version ID " + std::to_string(version_id) + " removed from runtime cache. It will be reloaded on next request.");
}

} // namespace core
} // namespace mlops
```