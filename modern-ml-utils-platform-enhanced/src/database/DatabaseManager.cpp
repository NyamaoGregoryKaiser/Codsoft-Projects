```cpp
#include "DatabaseManager.h"
#include "../utils/Logger.h"
#include "../utils/JsonUtils.h"
#include <filesystem>

namespace mlops {
namespace database {

namespace fs = std::filesystem;
using namespace sqlite_orm;

DatabaseManager::DatabaseManager(const std::string& db_path) {
    // Ensure the directory for the database exists
    fs::path path_obj(db_path);
    if (path_obj.has_parent_path()) {
        fs::create_directories(path_obj.parent_path());
    }

    storage_ = std::make_unique<Storage>(initStorage(db_path));
    storage_->sync_schema(); // This creates tables if they don't exist
    LOG_INFO("DatabaseManager initialized with path: " + db_path);
}

DatabaseManager::~DatabaseManager() {
    LOG_INFO("DatabaseManager shutting down.");
}

// --- DTO Conversions ---
ModelDTO DatabaseManager::toModelDTO(const Model& model) {
    return {model.id, model.name, model.description, model.created_at, model.updated_at};
}

Model DatabaseManager::fromModelDTO(const ModelDTO& dto) {
    return {dto.id.value_or(0), dto.name, dto.description, dto.created_at, dto.updated_at};
}

ModelVersionDTO DatabaseManager::toModelVersionDTO(const ModelVersion& version) {
    return {
        version.id,
        version.model_id,
        version.version_tag,
        version.model_path,
        version.created_at,
        version.is_active,
        utils::jsonToModelParameters(nlohmann::json::parse(version.parameters_json)),
        version.notes
    };
}

ModelVersion DatabaseManager::fromModelVersionDTO(const ModelVersionDTO& dto) {
    return {
        dto.id.value_or(0),
        dto.model_id,
        dto.version_tag,
        dto.model_path,
        dto.created_at,
        dto.is_active,
        utils::modelParametersToJson(dto.parameters).dump(),
        dto.notes
    };
}

PredictionLogDTO DatabaseManager::toPredictionLogDTO(const PredictionLog& log) {
    return {
        log.id,
        log.model_version_id,
        utils::jsonToPredictionInput(nlohmann::json::parse(log.input_data_json)),
        utils::jsonToPredictionOutput(nlohmann::json::parse(log.output_data_json)),
        log.timestamp,
        log.status,
        log.error_message
    };
}

PredictionLog DatabaseManager::fromPredictionLogDTO(const PredictionLogDTO& dto) {
    return {
        dto.id.value_or(0),
        dto.model_version_id,
        utils::predictionInputToJson(dto.input_data).dump(),
        utils::predictionOutputToJson(dto.output_data).dump(),
        dto.timestamp,
        dto.status,
        dto.error_message
    };
}

// --- Model Operations ---
std::optional<ModelDTO> DatabaseManager::createModel(ModelDTO& model_dto) {
    try {
        model_dto.created_at = getCurrentTimestamp();
        model_dto.updated_at = model_dto.created_at;
        Model model = fromModelDTO(model_dto);
        model.id = storage_->insert(model);
        model_dto.id = model.id;
        LOG_INFO("Created model: " + model.name + " with ID: " + std::to_string(model.id));
        return model_dto;
    } catch (const std::exception& e) {
        LOG_ERROR("Error creating model: " + std::string(e.what()));
        return std::nullopt;
    }
}

std::vector<ModelDTO> DatabaseManager::getModels() {
    std::vector<ModelDTO> dtos;
    try {
        auto models = storage_->get_all<Model>();
        for (const auto& model : models) {
            dtos.push_back(toModelDTO(model));
        }
    } catch (const std::exception& e) {
        LOG_ERROR("Error getting all models: " + std::string(e.what()));
    }
    return dtos;
}

std::optional<ModelDTO> DatabaseManager::getModelById(int id) {
    try {
        auto model_opt = storage_->get_pointer<Model>(id);
        if (model_opt) {
            return toModelDTO(*model_opt);
        }
    } catch (const std::exception& e) {
        LOG_ERROR("Error getting model by ID " + std::to_string(id) + ": " + std::string(e.what()));
    }
    return std::nullopt;
}

std::optional<ModelDTO> DatabaseManager::updateModel(int id, ModelDTO& model_dto) {
    try {
        auto existing_model = storage_->get_pointer<Model>(id);
        if (!existing_model) {
            LOG_WARN("Model with ID " + std::to_string(id) + " not found for update.");
            return std::nullopt;
        }

        existing_model->name = model_dto.name;
        existing_model->description = model_dto.description;
        existing_model->updated_at = getCurrentTimestamp();

        storage_->update(*existing_model);
        model_dto.id = existing_model->id; // Ensure DTO has ID
        model_dto.created_at = existing_model->created_at; // Preserve original created_at
        model_dto.updated_at = existing_model->updated_at;
        LOG_INFO("Updated model with ID: " + std::to_string(id));
        return model_dto;
    } catch (const std::exception& e) {
        LOG_ERROR("Error updating model with ID " + std::to_string(id) + ": " + std::string(e.what()));
        return std::nullopt;
    }
}

void DatabaseManager::deleteModel(int id) {
    try {
        storage_->remove<Model>(id);
        LOG_INFO("Deleted model with ID: " + std::to_string(id));
    } catch (const std::exception& e) {
        LOG_ERROR("Error deleting model with ID " + std::to_string(id) + ": " + std::string(e.what()));
    }
}

// --- Model Version Operations ---
std::optional<ModelVersionDTO> DatabaseManager::createModelVersion(ModelVersionDTO& version_dto) {
    try {
        // Check if model_id exists
        if (!storage_->get_pointer<Model>(version_dto.model_id)) {
            LOG_WARN("Cannot create model version: Model ID " + std::to_string(version_dto.model_id) + " does not exist.");
            return std::nullopt;
        }

        version_dto.created_at = getCurrentTimestamp();
        ModelVersion version = fromModelVersionDTO(version_dto);
        version.id = storage_->insert(version);
        version_dto.id = version.id;
        LOG_INFO("Created model version " + version.version_tag + " for model ID " + std::to_string(version.model_id) + " with ID: " + std::to_string(version.id));
        return version_dto;
    } catch (const std::exception& e) {
        LOG_ERROR("Error creating model version: " + std::string(e.what()));
        return std::nullopt;
    }
}

std::vector<ModelVersionDTO> DatabaseManager::getModelVersions(int model_id) {
    std::vector<ModelVersionDTO> dtos;
    try {
        auto versions = storage_->get_all<ModelVersion>(where(c(&ModelVersion::model_id) == model_id));
        for (const auto& version : versions) {
            dtos.push_back(toModelVersionDTO(version));
        }
    } catch (const std::exception& e) {
        LOG_ERROR("Error getting model versions for model ID " + std::to_string(model_id) + ": " + std::string(e.what()));
    }
    return dtos;
}

std::optional<ModelVersionDTO> DatabaseManager::getModelVersionById(int id) {
    try {
        auto version_opt = storage_->get_pointer<ModelVersion>(id);
        if (version_opt) {
            return toModelVersionDTO(*version_opt);
        }
    } catch (const std::exception& e) {
        LOG_ERROR("Error getting model version by ID " + std::to_string(id) + ": " + std::string(e.what()));
    }
    return std::nullopt;
}

std::optional<ModelVersionDTO> DatabaseManager::getModelVersionByModelAndTag(int model_id, const std::string& version_tag) {
    try {
        auto versions = storage_->get_all<ModelVersion>(
            where(c(&ModelVersion::model_id) == model_id && c(&ModelVersion::version_tag) == version_tag),
            limit(1)
        );
        if (!versions.empty()) {
            return toModelVersionDTO(versions.front());
        }
    } catch (const std::exception& e) {
        LOG_ERROR("Error getting model version for model ID " + std::to_string(model_id) + " and tag " + version_tag + ": " + std::string(e.what()));
    }
    return std::nullopt;
}

std::optional<ModelVersionDTO> DatabaseManager::updateModelVersion(int id, ModelVersionDTO& version_dto) {
    try {
        auto existing_version = storage_->get_pointer<ModelVersion>(id);
        if (!existing_version) {
            LOG_WARN("Model version with ID " + std::to_string(id) + " not found for update.");
            return std::nullopt;
        }
        
        // Only allow updating specific fields
        existing_version->version_tag = version_dto.version_tag;
        existing_version->model_path = version_dto.model_path;
        existing_version->is_active = version_dto.is_active;
        existing_version->parameters_json = utils::modelParametersToJson(version_dto.parameters).dump();
        existing_version->notes = version_dto.notes;

        storage_->update(*existing_version);
        version_dto.id = existing_version->id; // Ensure DTO has ID
        version_dto.model_id = existing_version->model_id; // Preserve model_id
        version_dto.created_at = existing_version->created_at; // Preserve created_at
        LOG_INFO("Updated model version with ID: " + std::to_string(id));
        return version_dto;
    } catch (const std::exception& e) {
        LOG_ERROR("Error updating model version with ID " + std::to_string(id) + ": " + std::string(e.what()));
        return std::nullopt;
    }
}

void DatabaseManager::deleteModelVersion(int id) {
    try {
        storage_->remove<ModelVersion>(id);
        LOG_INFO("Deleted model version with ID: " + std::to_string(id));
    } catch (const std::exception& e) {
        LOG_ERROR("Error deleting model version with ID " + std::to_string(id) + ": " + std::string(e.what()));
    }
}

void DatabaseManager::deactivateAllModelVersions(int model_id) {
    try {
        storage_->update_all(set(c(&ModelVersion::is_active) = false), where(c(&ModelVersion::model_id) == model_id));
        LOG_INFO("Deactivated all model versions for model ID: " + std::to_string(model_id));
    } catch (const std::exception& e) {
        LOG_ERROR("Error deactivating all model versions for model ID " + std::to_string(model_id) + ": " + std::string(e.what()));
    }
}


// --- Prediction Log Operations ---
std::optional<PredictionLogDTO> DatabaseManager::createPredictionLog(PredictionLogDTO& log_dto) {
    try {
        log_dto.timestamp = getCurrentTimestamp();
        PredictionLog log = fromPredictionLogDTO(log_dto);
        log.id = storage_->insert(log);
        log_dto.id = log.id;
        LOG_INFO("Logged prediction for model version ID " + std::to_string(log.model_version_id));
        return log_dto;
    } catch (const std::exception& e) {
        LOG_ERROR("Error creating prediction log: " + std::string(e.what()));
        return std::nullopt;
    }
}

std::vector<PredictionLogDTO> DatabaseManager::getPredictionLogs(int model_version_id) {
    std::vector<PredictionLogDTO> dtos;
    try {
        auto logs = storage_->get_all<PredictionLog>(
            where(c(&PredictionLog::model_version_id) == model_version_id),
            order_by(&PredictionLog::timestamp).desc(),
            limit(100) // Limit to last 100 predictions for performance
        );
        for (const auto& log : logs) {
            dtos.push_back(toPredictionLogDTO(log));
        }
    } catch (const std::exception& e) {
        LOG_ERROR("Error getting prediction logs for model version ID " + std::to_string(model_version_id) + ": " + std::string(e.what()));
    }
    return dtos;
}

} // namespace database
} // namespace mlops
```