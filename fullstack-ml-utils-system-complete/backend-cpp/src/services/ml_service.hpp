#ifndef ML_UTILITIES_SYSTEM_ML_SERVICE_HPP
#define ML_UTILITIES_SYSTEM_ML_SERVICE_HPP

#include <string>
#include <vector>
#include <optional>
#include <memory>
#include <stdexcept>
#include "../repositories/model_repository.hpp"
#include "../models/ml_model.hpp"
#include "../models/data_point.hpp"
#include "../utils/logger.hpp"
#include "../utils/cache_manager.hpp" // For Caching
#include "../common/constants.hpp"
#include "nlohmann/json.hpp"

// Placeholder for an actual ML inference engine (e.g., ONNX Runtime C++ API, TF Lite C++ API)
namespace MLInferenceEngine {
    /**
     * @brief Mocks loading an ML model.
     * In a real system, this would load a model file (e.g., ONNX, Pytorch JIT)
     * and initialize the inference session.
     * @param model_path The path to the model file.
     * @param model_type The type of the model (e.g., "onnx", "classification").
     * @return True if model "loaded" successfully.
     */
    bool loadModel(const std::string& model_path, const std::string& model_type) {
        LOG_DEBUG("MLInferenceEngine: Mock loading model from '{}' of type '{}'.", model_path, model_type);
        // Simulate some loading time/logic
        if (model_path.empty() || model_path.find("invalid") != std::string::npos) {
            return false;
        }
        return true;
    }

    /**
     * @brief Mocks performing inference with an ML model.
     * In a real system, this would take parsed input, run it through the loaded model,
     * and return structured predictions.
     * @param model_id The ID of the model to use for inference.
     * @param input_data A JSON string representing the input features.
     * @return A JSON string representing the prediction result.
     * @throws std::runtime_error if inference fails.
     */
    std::string performInference(int model_id, const std::string& input_data) {
        LOG_DEBUG("MLInferenceEngine: Mock performing inference for model {} with input: {}", model_id, input_data);
        // Simulate parsing input and generating a prediction
        try {
            nlohmann::json input_json = nlohmann::json::parse(input_data);
            nlohmann::json prediction_json;

            // Simple mock logic: if input has 'feature1', predict 'output'
            if (input_json.contains("feature1")) {
                prediction_json["prediction"] = "class_A";
                prediction_json["probability"] = 0.95;
            } else if (input_json.contains("value")) {
                prediction_json["score"] = input_json["value"].get<double>() * 1.5;
            } else {
                prediction_json["prediction"] = "unknown";
                prediction_json["probability"] = 0.5;
            }

            return prediction_json.dump();
        } catch (const nlohmann::json::parse_error& e) {
            LOG_ERROR("MLInferenceEngine: Invalid JSON input for inference: {}", e.what());
            throw std::runtime_error("Invalid input data format for inference.");
        } catch (const std::exception& e) {
            LOG_ERROR("MLInferenceEngine: Error during mock inference: {}", e.what());
            throw std::runtime_error("ML inference failed: " + std::string(e.what()));
        }
    }

    /**
     * @brief Mocks preprocessing input data.
     * In a real system, this could involve scaling, one-hot encoding, imputation, etc.
     * @param input_data A JSON string of raw input.
     * @param model_metadata Optional metadata for preprocessing rules.
     * @return A JSON string of preprocessed data suitable for inference.
     * @throws std::runtime_error if preprocessing fails.
     */
    std::string preprocessData(const std::string& input_data, const std::optional<std::string>& model_metadata) {
        LOG_DEBUG("MLInferenceEngine: Mock preprocessing data with input: {}", input_data);
        try {
            nlohmann::json data_json = nlohmann::json::parse(input_data);
            nlohmann::json preprocessed_json = data_json; // Start with input data

            // Example preprocessing: If metadata specifies a 'scaler', apply a simple mock scaling
            if (model_metadata && !model_metadata->empty()) {
                nlohmann::json meta_json = nlohmann::json::parse(*model_metadata);
                if (meta_json.contains("preprocessing") && meta_json["preprocessing"].contains("scaler")) {
                    LOG_DEBUG("Applying mock scaling based on model metadata.");
                    if (preprocessed_json.contains("feature1") && preprocessed_json["feature1"].is_number()) {
                        preprocessed_json["feature1"] = preprocessed_json["feature1"].get<double>() / 100.0;
                    }
                }
            }

            preprocessed_json["_processed_at"] = std::chrono::duration_cast<std::chrono::milliseconds>(
                std::chrono::system_clock::now().time_since_epoch()).count();

            return preprocessed_json.dump();
        } catch (const nlohmann::json::parse_error& e) {
            LOG_ERROR("MLInferenceEngine: Invalid JSON input for preprocessing: {}", e.what());
            throw std::runtime_error("Invalid input data format for preprocessing.");
        } catch (const std::exception& e) {
            LOG_ERROR("MLInferenceEngine: Error during mock preprocessing: {}", e.what());
            throw std::runtime_error("Data preprocessing failed: " + std::string(e.what()));
        }
    }
} // namespace MLInferenceEngine


/**
 * @brief Service layer for Machine Learning model management and inference.
 * Handles CRUD for models, and orchestrates inference requests.
 */
class MLService {
private:
    std::shared_ptr<ModelRepository> model_repository;

public:
    /**
     * @brief Constructs an MLService.
     * @param model_repo Shared pointer to the ModelRepository.
     */
    explicit MLService(std::shared_ptr<ModelRepository> model_repo) : model_repository(std::move(model_repo)) {
        if (!model_repository) {
            LOG_CRITICAL("MLService initialized with a null ModelRepository.");
            throw std::runtime_error("ModelRepository cannot be null.");
        }
        LOG_DEBUG("MLService initialized.");
    }

    // --- Model Management ---

    /**
     * @brief Registers a new ML model in the system.
     * @param name Name of the model.
     * @param version Version of the model.
     * @param type Type of the model (e.g., "classification").
     * @param file_path Path to the model file.
     * @param description Model description.
     * @param owner_id ID of the user registering the model.
     * @param metadata Optional JSON string for model-specific metadata.
     * @return The registered MLModel object.
     * @throws std::runtime_error if model loading fails or database error occurs.
     */
    MLModel registerModel(const std::string& name, const std::string& version, const std::string& type,
                          const std::string& file_path, const std::string& description,
                          int owner_id, const std::optional<std::string>& metadata) {
        // In a real system, you'd load and validate the model file here
        if (!MLInferenceEngine::loadModel(file_path, type)) {
            LOG_ERROR("Failed to load model file '{}' for registration.", file_path);
            throw std::runtime_error("Invalid model file or path.");
        }

        MLModel new_model{0, name, version, type, file_path, description, owner_id, {}, metadata};
        try {
            MLModel created_model = model_repository->createModel(new_model);
            CacheManager::remove("all_models"); // Invalidate cache for all models
            CacheManager::remove("user_models_" + std::to_string(owner_id)); // Invalidate cache for owner's models
            LOG_INFO("ML model '{}' (v{}) registered by user {}.", name, version, owner_id);
            return created_model;
        } catch (const std::exception& e) {
            LOG_ERROR("Failed to register ML model '{}' (v{}): {}", name, version, e.what());
            throw;
        }
    }

    /**
     * @brief Retrieves an ML model by its ID.
     * @param model_id The ID of the model.
     * @return An `std::optional<MLModel>` containing the model if found, `std::nullopt` otherwise.
     */
    std::optional<MLModel> getModelById(int model_id) {
        // Try to get from cache first
        std::string cache_key = "model_" + std::to_string(model_id);
        if (auto cached_model_json = CacheManager::get(cache_key)) {
            try {
                // Deserialize from JSON string back to MLModel
                nlohmann::json j = nlohmann::json::parse(*cached_model_json);
                MLModel model;
                model.id = j.value("id", 0);
                model.name = j.value("name", "");
                model.version = j.value("version", "");
                model.type = j.value("type", "");
                model.file_path = j.value("filePath", "");
                model.description = j.value("description", "");
                model.owner_id = j.value("ownerId", 0);
                model.created_at = std::chrono::system_clock::from_time_t(j.value("createdAt", 0LL));
                if (j.contains("metadata") && !j["metadata"].is_null()) {
                    model.metadata = j["metadata"].dump(); // Store back as string
                }
                LOG_DEBUG("Retrieved ML model {} from cache.", model_id);
                return model;
            } catch (const std::exception& e) {
                LOG_ERROR("Failed to deserialize cached model for {}: {}", model_id, e.what());
                CacheManager::remove(cache_key); // Invalidate corrupted cache entry
            }
        }

        // If not in cache or deserialization failed, fetch from DB
        try {
            auto model_opt = model_repository->findModelById(model_id);
            if (model_opt) {
                // Cache the model if found
                CacheManager::set(cache_key, model_opt->toJson().dump());
            }
            return model_opt;
        } catch (const std::exception& e) {
            LOG_ERROR("Failed to get ML model by ID {}: {}", model_id, e.what());
            throw;
        }
    }

    /**
     * @brief Retrieves all ML models owned by a specific user.
     * @param owner_id The ID of the owner.
     * @return A vector of MLModel objects.
     */
    std::vector<MLModel> getModelsByOwner(int owner_id) {
        std::string cache_key = "user_models_" + std::to_string(owner_id);
        if (auto cached_models_json = CacheManager::get(cache_key)) {
            try {
                std::vector<MLModel> models;
                nlohmann::json j_array = nlohmann::json::parse(*cached_models_json);
                for (const auto& j : j_array) {
                    MLModel model;
                    model.id = j.value("id", 0);
                    model.name = j.value("name", "");
                    model.version = j.value("version", "");
                    model.type = j.value("type", "");
                    model.file_path = j.value("filePath", "");
                    model.description = j.value("description", "");
                    model.owner_id = j.value("ownerId", 0);
                    model.created_at = std::chrono::system_clock::from_time_t(j.value("createdAt", 0LL));
                     if (j.contains("metadata") && !j["metadata"].is_null()) {
                        model.metadata = j["metadata"].dump();
                    }
                    models.push_back(model);
                }
                LOG_DEBUG("Retrieved {} models for owner {} from cache.", models.size(), owner_id);
                return models;
            } catch (const std::exception& e) {
                LOG_ERROR("Failed to deserialize cached models for owner {}: {}", owner_id, e.what());
                CacheManager::remove(cache_key);
            }
        }

        try {
            auto models = model_repository->findModelsByOwner(owner_id);
            if (!models.empty()) {
                nlohmann::json j_array = nlohmann::json::array();
                for (const auto& model : models) {
                    j_array.push_back(model.toJson());
                }
                CacheManager::set(cache_key, j_array.dump());
            }
            return models;
        } catch (const std::exception& e) {
            LOG_ERROR("Failed to get ML models for owner {}: {}", owner_id, e.what());
            throw;
        }
    }

    /**
     * @brief Retrieves all ML models in the system (admin access required typically).
     * @return A vector of all MLModel objects.
     */
    std::vector<MLModel> getAllModels() {
        std::string cache_key = "all_models";
        if (auto cached_models_json = CacheManager::get(cache_key)) {
            try {
                std::vector<MLModel> models;
                nlohmann::json j_array = nlohmann::json::parse(*cached_models_json);
                for (const auto& j : j_array) {
                    MLModel model;
                    model.id = j.value("id", 0);
                    model.name = j.value("name", "");
                    model.version = j.value("version", "");
                    model.type = j.value("type", "");
                    model.file_path = j.value("filePath", "");
                    model.description = j.value("description", "");
                    model.owner_id = j.value("ownerId", 0);
                    model.created_at = std::chrono::system_clock::from_time_t(j.value("createdAt", 0LL));
                    if (j.contains("metadata") && !j["metadata"].is_null()) {
                        model.metadata = j["metadata"].dump();
                    }
                    models.push_back(model);
                }
                LOG_DEBUG("Retrieved all ML models from cache.");
                return models;
            } catch (const std::exception& e) {
                LOG_ERROR("Failed to deserialize cached all models: {}", e.what());
                CacheManager::remove(cache_key);
            }
        }

        try {
            auto models = model_repository->findAllModels();
            if (!models.empty()) {
                nlohmann::json j_array = nlohmann::json::array();
                for (const auto& model : models) {
                    j_array.push_back(model.toJson());
                }
                CacheManager::set(cache_key, j_array.dump());
            }
            return models;
        } catch (const std::exception& e) {
            LOG_ERROR("Failed to get all ML models: {}", e.what());
            throw;
        }
    }

    /**
     * @brief Updates an existing ML model.
     * @param model_id The ID of the model to update.
     * @param owner_id The ID of the user owning the model (for authorization).
     * @param name Optional new name.
     * @param version Optional new version.
     * @param type Optional new type.
     * @param file_path Optional new file path.
     * @param description Optional new description.
     * @param metadata Optional new JSON string for metadata.
     * @return The updated MLModel object.
     * @throws std::runtime_error if model not found, not owned by user, or other errors.
     */
    MLModel updateModel(int model_id, int owner_id,
                        const std::optional<std::string>& name,
                        const std::optional<std::string>& version,
                        const std::optional<std::string>& type,
                        const std::optional<std::string>& file_path,
                        const std::optional<std::string>& description,
                        const std::optional<std::string>& metadata) {
        std::optional<MLModel> existing_model_opt = model_repository->findModelById(model_id);
        if (!existing_model_opt || existing_model_opt->owner_id != owner_id) {
            LOG_WARN("Update model failed: Model ID {} not found or not owned by user {}.", model_id, owner_id);
            throw std::runtime_error(Constants::ERR_MODEL_NOT_FOUND);
        }

        MLModel model = *existing_model_opt;
        bool changed = false;

        if (name && *name != model.name) { model.name = *name; changed = true; }
        if (version && *version != model.version) { model.version = *version; changed = true; }
        if (type && *type != model.type) { model.type = *type; changed = true; }
        if (file_path && *file_path != model.file_path) { model.file_path = *file_path; changed = true; }
        if (description && *description != model.description) { model.description = *description; changed = true; }
        if (metadata) { // metadata can be nullopt to clear it
            if (!model.metadata || *metadata != *model.metadata) {
                model.metadata = metadata; changed = true;
            }
        } else if (model.metadata) { // if metadata existed and new is nullopt, it's a change
            model.metadata = std::nullopt; changed = true;
        }

        if (changed) {
            try {
                if (!model_repository->updateModel(model)) {
                    LOG_ERROR("Failed to update model {} despite changes found (repository returned false).", model_id);
                    throw std::runtime_error(Constants::ERR_INTERNAL_SERVER_ERROR);
                }
                CacheManager::remove("model_" + std::to_string(model_id)); // Invalidate specific model cache
                CacheManager::remove("all_models"); // Invalidate cache for all models
                CacheManager::remove("user_models_" + std::to_string(owner_id)); // Invalidate cache for owner's models
                LOG_INFO("ML model ID {} updated by owner {}.", model_id, owner_id);
                return *model_repository->findModelById(model_id); // Fetch updated model from DB
            } catch (const std::exception& e) {
                LOG_ERROR("Failed to update ML model ID {}: {}", model_id, e.what());
                throw;
            }
        } else {
            LOG_DEBUG("No changes requested for ML model ID {}.", model_id);
            return model; // Return original model if no changes
        }
    }

    /**
     * @brief Deletes an ML model.
     * @param model_id The ID of the model to delete.
     * @param owner_id The ID of the user owning the model (for authorization).
     * @return True if the model was deleted, false if not found or not owned by user.
     * @throws std::runtime_error if other errors occur.
     */
    bool deleteModel(int model_id, int owner_id) {
        try {
            if (!model_repository->deleteModel(model_id, owner_id)) {
                LOG_WARN("Deletion failed: Model ID {} not found or not owned by user {}.", model_id, owner_id);
                return false;
            }
            CacheManager::remove("model_" + std::to_string(model_id)); // Invalidate specific model cache
            CacheManager::remove("all_models"); // Invalidate cache for all models
            CacheManager::remove("user_models_" + std::to_string(owner_id)); // Invalidate cache for owner's models
            LOG_INFO("ML model ID {} deleted by owner {}.", model_id, owner_id);
            return true;
        } catch (const std::exception& e) {
            LOG_ERROR("Failed to delete ML model ID {}: {}", model_id, e.what());
            throw;
        }
    }

    // --- Inference & Data Point Management ---

    /**
     * @brief Performs ML inference using a registered model.
     * @param model_id The ID of the model to use.
     * @param user_id The ID of the user making the request.
     * @param raw_input_data The raw input data as a JSON string.
     * @return The DataPoint object containing input and prediction.
     * @throws std::runtime_error if model not found, invalid input, or inference fails.
     */
    DataPoint performInference(int model_id, int user_id, const std::string& raw_input_data) {
        std::optional<MLModel> model_opt = getModelById(model_id); // Uses cache
        if (!model_opt) {
            LOG_WARN("Inference failed: Model ID {} not found.", model_id);
            throw std::runtime_error(Constants::ERR_MODEL_NOT_FOUND);
        }
        MLModel model = *model_opt;

        try {
            // 1. Preprocess data (mock implementation)
            std::string preprocessed_data = MLInferenceEngine::preprocessData(raw_input_data, model.metadata);

            // 2. Perform actual inference (mock implementation)
            std::string prediction_result = MLInferenceEngine::performInference(model.id, preprocessed_data);

            // 3. Store data point
            DataPoint new_data_point{0, model.id, user_id, raw_input_data, prediction_result, {}};
            DataPoint created_dp = model_repository->createDataPoint(new_data_point);
            LOG_INFO("Inference performed for model {} by user {}. DataPoint ID: {}.", model.id, user_id, created_dp.id);
            return created_dp;
        } catch (const std::exception& e) {
            LOG_ERROR("ML inference for model {} failed for user {}: {}", model_id, user_id, e.what());
            throw; // Re-throw to be caught by error middleware
        }
    }

    /**
     * @brief Retrieves a specific data point.
     * @param dp_id The ID of the data point.
     * @param user_id The ID of the user requesting the data point.
     * @return An `std::optional<DataPoint>` if found and owned by user, `std::nullopt` otherwise.
     */
    std::optional<DataPoint> getDataPoint(int dp_id, int user_id) {
        try {
            return model_repository->findDataPointByIdAndUser(dp_id, user_id);
        } catch (const std::exception& e) {
            LOG_ERROR("Failed to get data point {} for user {}: {}", dp_id, user_id, e.what());
            throw;
        }
    }

    /**
     * @brief Retrieves all data points associated with a model and user.
     * @param model_id The ID of the model.
     * @param user_id The ID of the user.
     * @return A vector of DataPoint objects.
     */
    std::vector<DataPoint> getDataPointsByModelAndUser(int model_id, int user_id) {
        try {
            return model_repository->findDataPointsByModelAndUser(model_id, user_id);
        } catch (const std::exception& e) {
            LOG_ERROR("Failed to get data points for model {} by user {}: {}", model_id, user_id, e.what());
            throw;
        }
    }
};

#endif // ML_UTILITIES_SYSTEM_ML_SERVICE_HPP
```