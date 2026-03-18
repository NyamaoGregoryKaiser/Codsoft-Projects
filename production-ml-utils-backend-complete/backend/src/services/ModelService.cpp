#include "ModelService.h"
#include "database/DatabaseManager.h"
#include "common/ErrorHandling.h"
#include "spdlog/spdlog.h"

Model ModelService::createModel(const Model& model) {
    DatabaseManager& db_manager = DatabaseManager::getInstance();

    // Check for existing model with same name for the user
    try {
        std::vector<Model> existing_models = db_manager.query<Model>(
            "SELECT id, user_id, name, description, version, model_path, status, metadata, created_at, updated_at FROM models WHERE user_id = ? AND name = ?;",
            [&](sqlite::database_binder& binder) {
                return Model{
                    binder.get<std::string>(0), binder.get<std::string>(1), binder.get<std::string>(2),
                    binder.get<std::string>(3), binder.get<std::string>(4), binder.get<std::string>(5),
                    binder.get<std::string>(6), nlohmann::json::parse(binder.get<std::string>(7)),
                    binder.get<std::string>(8), binder.get<std::string>(9)
                };
            }
        );
        for (const auto& existing_model : existing_models) {
            if (existing_model.name == model.name) {
                throw BadRequestError("Model with this name already exists for this user.");
            }
        }
    } catch (const sqlite::sqlite_exception& e) {
        spdlog::error("SQLite error checking existing models: {}", e.what());
        // Continue if no specific error for "not found"
    }

    try {
        db_manager.getDb() << "INSERT INTO models (id, user_id, name, description, version, model_path, status, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?);"
            << model.id
            << model.user_id
            << model.name
            << model.description
            << model.version
            << model.model_path
            << model.status
            << model.metadata.dump(); // Store JSON as string

        spdlog::info("Model created by user {}: {}", model.user_id, model.name);
        return model;
    } catch (const sqlite::sqlite_exception& e) {
        spdlog::error("SQLite error creating model: {}", e.what());
        throw InternalServerError("Failed to create model.");
    }
}

std::optional<Model> ModelService::getModelById(const std::string& id, const std::string& user_id) {
    DatabaseManager& db_manager = DatabaseManager::getInstance();
    std::optional<Model> model_opt;
    try {
        db_manager.getDb() << "SELECT id, user_id, name, description, version, model_path, status, metadata, created_at, updated_at FROM models WHERE id = ? AND user_id = ?;"
            << id
            << user_id
            >> [&](std::string model_id, std::string retrieved_user_id, std::string name, std::string desc, std::string version, std::string path, std::string status, std::string metadata_str, std::string created_at, std::string updated_at) {
                model_opt = Model{model_id, retrieved_user_id, name, desc, version, path, status, nlohmann::json::parse(metadata_str), created_at, updated_at};
            };
    } catch (const sqlite::sqlite_exception& e) {
        if (e.get_sqlite_code() == SQLITE_NOTFOUND) {
            return std::nullopt; // No model found for this ID and user
        }
        spdlog::error("SQLite error getting model by ID: {}", e.what());
        throw InternalServerError("Failed to retrieve model.");
    }
    return model_opt;
}

std::vector<Model> ModelService::listModels(const std::string& user_id) {
    DatabaseManager& db_manager = DatabaseManager::getInstance();
    std::vector<Model> models;
    try {
        models = db_manager.query<Model>(
            "SELECT id, user_id, name, description, version, model_path, status, metadata, created_at, updated_at FROM models WHERE user_id = ? ORDER BY created_at DESC;",
            [&](sqlite::database_binder& binder) {
                return Model{
                    binder.get<std::string>(0), binder.get<std::string>(1), binder.get<std::string>(2),
                    binder.get<std::string>(3), binder.get<std::string>(4), binder.get<std::string>(5),
                    binder.get<std::string>(6), nlohmann::json::parse(binder.get<std::string>(7)),
                    binder.get<std::string>(8), binder.get<std::string>(9)
                };
            }
        );
    } catch (const sqlite::sqlite_exception& e) {
        spdlog::error("SQLite error listing models: {}", e.what());
        throw InternalServerError("Failed to list models.");
    }
    return models;
}

Model ModelService::updateModel(const std::string& id, const std::string& user_id, const Model& updated_model_data) {
    DatabaseManager& db_manager = DatabaseManager::getInstance();

    // First, check if the model exists and belongs to the user
    std::optional<Model> existing_model = getModelById(id, user_id);
    if (!existing_model.has_value()) {
        throw NotFoundError("Model not found or not accessible by this user.");
    }

    try {
        // Construct the update query dynamically based on provided fields (simplified for example)
        std::string sql = "UPDATE models SET ";
        std::vector<std::pair<std::string, std::string>> updates; // Field name, value

        if (!updated_model_data.name.empty()) {
            updates.push_back({"name", updated_model_data.name});
        }
        if (!updated_model_data.description.empty()) {
            updates.push_back({"description", updated_model_data.description});
        }
        if (!updated_model_data.version.empty()) {
            updates.push_back({"version", updated_model_data.version});
        }
        if (!updated_model_data.model_path.empty()) {
            updates.push_back({"model_path", updated_model_data.model_path});
        }
        if (!updated_model_data.status.empty()) {
            updates.push_back({"status", updated_model_data.status});
        }
        // Metadata needs special handling: merge or replace
        if (!updated_model_data.metadata.empty() && updated_model_data.metadata.is_object()) {
            // For simplicity, we replace. In production, consider merging JSON fields.
            updates.push_back({"metadata", updated_model_data.metadata.dump()});
        }

        if (updates.empty()) {
            throw BadRequestError("No fields provided for update.");
        }

        for (size_t i = 0; i < updates.size(); ++i) {
            sql += updates[i].first + " = ?";
            if (i < updates.size() - 1) {
                sql += ", ";
            }
        }
        sql += ", updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?;";

        db_manager.getDb() << sql << [&](sqlite::database_binder& binder) {
            for (const auto& pair : updates) {
                binder << pair.second;
            }
            binder << id << user_id;
        };

        spdlog::info("Model updated: {}", id);
        // Retrieve the updated model to return the latest state
        return getModelById(id, user_id).value();
    } catch (const sqlite::sqlite_exception& e) {
        spdlog::error("SQLite error updating model {}: {}", id, e.what());
        throw InternalServerError("Failed to update model.");
    }
}

void ModelService::deleteModel(const std::string& id, const std::string& user_id) {
    DatabaseManager& db_manager = DatabaseManager::getInstance();

    // First, check if the model exists and belongs to the user
    std::optional<Model> existing_model = getModelById(id, user_id);
    if (!existing_model.has_value()) {
        throw NotFoundError("Model not found or not accessible by this user.");
    }

    try {
        db_manager.getDb() << "DELETE FROM models WHERE id = ? AND user_id = ?;"
            << id
            << user_id;
        spdlog::info("Model deleted: {}", id);
    } catch (const sqlite::sqlite_exception& e) {
        spdlog::error("SQLite error deleting model {}: {}", id, e.what());
        throw InternalServerError("Failed to delete model.");
    }
}
```