#ifndef ML_UTILITIES_SYSTEM_MODEL_REPOSITORY_HPP
#define ML_UTILITIES_SYSTEM_MODEL_REPOSITORY_HPP

#include <string>
#include <vector>
#include <optional>
#include <memory>
#include <chrono>
#include <pqxx/pqxx>
#include "../models/ml_model.hpp"
#include "../models/data_point.hpp"
#include "db_connection.hpp"
#include "../utils/logger.hpp"

/**
 * @brief Repository for ML Model and DataPoint data, handling CRUD operations.
 */
class ModelRepository {
private:
    std::shared_ptr<DBConnectionPool> db_pool;

public:
    /**
     * @brief Constructs a ModelRepository with a database connection pool.
     * @param pool Shared pointer to the DBConnectionPool.
     */
    explicit ModelRepository(std::shared_ptr<DBConnectionPool> pool) : db_pool(std::move(pool)) {
        if (!db_pool) {
            LOG_CRITICAL("ModelRepository initialized with a null DBConnectionPool.");
            throw std::runtime_error("DBConnectionPool cannot be null.");
        }
        LOG_DEBUG("ModelRepository initialized.");
    }

    // --- MLModel CRUD Operations ---

    /**
     * @brief Creates a new ML model entry in the database.
     * @param model An MLModel object containing the new model's data.
     * @return The created MLModel object with its assigned ID and creation timestamp.
     */
    MLModel createModel(const MLModel& model) {
        try {
            ScopedConnection scoped_conn(db_pool.get());
            pqxx::work txn(scoped_conn.get());
            pqxx::result r = txn.exec_params(
                "INSERT INTO ml_models (name, version, type, file_path, description, owner_id, created_at, metadata) "
                "VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7) "
                "RETURNING id, created_at",
                model.name, model.version, model.type, model.file_path, model.description, model.owner_id,
                model.metadata ? *model.metadata : pqxx::null<std::string>()
            );
            txn.commit();

            const auto& row = r[0];
            MLModel created_model = model;
            created_model.id = row["id"].as<int>();
            created_model.created_at = std::chrono::system_clock::from_time_t(row["created_at"].as<std::time_t>());
            LOG_INFO("Model '{}' (version {}) created with ID {}.", created_model.name, created_model.version, created_model.id);
            return created_model;
        } catch (const pqxx::sql_error& e) {
            LOG_ERROR("SQL Error creating model '{}' (v{}): {}. Query: {}", model.name, model.version, e.what(), e.query());
            throw;
        } catch (const std::exception& e) {
            LOG_ERROR("Error creating model '{}' (v{}): {}", model.name, model.version, e.what());
            throw;
        }
    }

    /**
     * @brief Finds an ML model by its ID.
     * @param id The ID of the model to find.
     * @return An `std::optional<MLModel>` containing the model if found, `std::nullopt` otherwise.
     */
    std::optional<MLModel> findModelById(int id) {
        try {
            ScopedConnection scoped_conn(db_pool.get());
            pqxx::work txn(scoped_conn.get());
            pqxx::result r = txn.exec_params(
                "SELECT id, name, version, type, file_path, description, owner_id, created_at, metadata "
                "FROM ml_models WHERE id = $1",
                id
            );

            if (r.empty()) {
                LOG_DEBUG("MLModel with ID {} not found.", id);
                return std::nullopt;
            }

            const auto& row = r[0];
            std::optional<std::string> metadata_opt;
            if (row["metadata"].is_null() == false) {
                metadata_opt = row["metadata"].as<std::string>();
            }

            return MLModel{
                row["id"].as<int>(),
                row["name"].as<std::string>(),
                row["version"].as<std::string>(),
                row["type"].as<std::string>(),
                row["file_path"].as<std::string>(),
                row["description"].as<std::string>(),
                row["owner_id"].as<int>(),
                std::chrono::system_clock::from_time_t(row["created_at"].as<std::time_t>()),
                metadata_opt
            };
        } catch (const pqxx::sql_error& e) {
            LOG_ERROR("SQL Error finding model by ID {}: {}. Query: {}", id, e.what(), e.query());
            throw;
        } catch (const std::exception& e) {
            LOG_ERROR("Error finding model by ID {}: {}", id, e.what());
            throw;
        }
    }

    /**
     * @brief Finds all ML models belonging to a specific user.
     * @param owner_id The ID of the user who owns the models.
     * @return A vector of MLModel objects.
     */
    std::vector<MLModel> findModelsByOwner(int owner_id) {
        std::vector<MLModel> models;
        try {
            ScopedConnection scoped_conn(db_pool.get());
            pqxx::work txn(scoped_conn.get());
            pqxx::result r = txn.exec_params(
                "SELECT id, name, version, type, file_path, description, owner_id, created_at, metadata "
                "FROM ml_models WHERE owner_id = $1 ORDER BY created_at DESC",
                owner_id
            );

            for (const auto& row : r) {
                std::optional<std::string> metadata_opt;
                if (row["metadata"].is_null() == false) {
                    metadata_opt = row["metadata"].as<std::string>();
                }
                models.push_back({
                    row["id"].as<int>(),
                    row["name"].as<std::string>(),
                    row["version"].as<std::string>(),
                    row["type"].as<std::string>(),
                    row["file_path"].as<std::string>(),
                    row["description"].as<std::string>(),
                    row["owner_id"].as<int>(),
                    std::chrono::system_clock::from_time_t(row["created_at"].as<std::time_t>()),
                    metadata_opt
                });
            }
            LOG_DEBUG("Found {} models for owner ID {}.", models.size(), owner_id);
        } catch (const pqxx::sql_error& e) {
            LOG_ERROR("SQL Error finding models by owner ID {}: {}. Query: {}", owner_id, e.what(), e.query());
            throw;
        } catch (const std::exception& e) {
            LOG_ERROR("Error finding models by owner ID {}: {}", owner_id, e.what());
            throw;
        }
        return models;
    }

    /**
     * @brief Finds all ML models in the database.
     * @return A vector of MLModel objects.
     */
    std::vector<MLModel> findAllModels() {
        std::vector<MLModel> models;
        try {
            ScopedConnection scoped_conn(db_pool.get());
            pqxx::work txn(scoped_conn.get());
            pqxx::result r = txn.exec(
                "SELECT id, name, version, type, file_path, description, owner_id, created_at, metadata "
                "FROM ml_models ORDER BY created_at DESC"
            );

            for (const auto& row : r) {
                std::optional<std::string> metadata_opt;
                if (row["metadata"].is_null() == false) {
                    metadata_opt = row["metadata"].as<std::string>();
                }
                models.push_back({
                    row["id"].as<int>(),
                    row["name"].as<std::string>(),
                    row["version"].as<std::string>(),
                    row["type"].as<std::string>(),
                    row["file_path"].as<std::string>(),
                    row["description"].as<std::string>(),
                    row["owner_id"].as<int>(),
                    std::chrono::system_clock::from_time_t(row["created_at"].as<std::time_t>()),
                    metadata_opt
                });
            }
            LOG_DEBUG("Found {} total models.", models.size());
        } catch (const pqxx::sql_error& e) {
            LOG_ERROR("SQL Error finding all models: {}. Query: {}", e.what(), e.query());
            throw;
        } catch (const std::exception& e) {
            LOG_ERROR("Error finding all models: {}", e.what());
            throw;
        }
        return models;
    }


    /**
     * @brief Updates an existing ML model entry in the database.
     * @param model An MLModel object with the updated data. The `id` field must be set.
     * @return True if the model was updated, false if not found.
     */
    bool updateModel(const MLModel& model) {
        try {
            ScopedConnection scoped_conn(db_pool.get());
            pqxx::work txn(scoped_conn.get());
            pqxx::result r = txn.exec_params(
                "UPDATE ml_models SET name = $1, version = $2, type = $3, file_path = $4, "
                "description = $5, metadata = $6 WHERE id = $7 AND owner_id = $8",
                model.name, model.version, model.type, model.file_path,
                model.description, model.metadata ? *model.metadata : pqxx::null<std::string>(),
                model.id, model.owner_id
            );
            txn.commit();
            if (r.affected_rows() > 0) {
                LOG_INFO("MLModel with ID {} updated.", model.id);
                return true;
            }
            LOG_DEBUG("MLModel with ID {} and owner {} not found for update.", model.id, model.owner_id);
            return false;
        } catch (const pqxx::sql_error& e) {
            LOG_ERROR("SQL Error updating model {}: {}. Query: {}", model.id, e.what(), e.query());
            throw;
        } catch (const std::exception& e) {
            LOG_ERROR("Error updating model {}: {}", model.id, e.what());
            throw;
        }
    }

    /**
     * @brief Deletes an ML model from the database by ID and owner ID.
     * @param id The ID of the model to delete.
     * @param owner_id The ID of the user who owns the model.
     * @return True if the model was deleted, false if not found or not owned by user.
     */
    bool deleteModel(int id, int owner_id) {
        try {
            ScopedConnection scoped_conn(db_pool.get());
            pqxx::work txn(scoped_conn.get());
            pqxx::result r = txn.exec_params("DELETE FROM ml_models WHERE id = $1 AND owner_id = $2", id, owner_id);
            txn.commit();
            if (r.affected_rows() > 0) {
                LOG_INFO("MLModel with ID {} deleted by owner {}.", id, owner_id);
                return true;
            }
            LOG_DEBUG("MLModel with ID {} and owner {} not found for deletion.", id, owner_id);
            return false;
        } catch (const pqxx::sql_error& e) {
            LOG_ERROR("SQL Error deleting model {}: {}. Query: {}", id, e.what(), e.query());
            throw;
        } catch (const std::exception& e) {
            LOG_ERROR("Error deleting model {}: {}", id, e.what());
            throw;
        }
    }

    // --- DataPoint CRUD Operations ---

    /**
     * @brief Creates a new data point entry in the database.
     * @param data_point A DataPoint object containing the new data point's data.
     * @return The created DataPoint object with its assigned ID and creation timestamp.
     */
    DataPoint createDataPoint(const DataPoint& data_point) {
        try {
            ScopedConnection scoped_conn(db_pool.get());
            pqxx::work txn(scoped_conn.get());
            pqxx::result r = txn.exec_params(
                "INSERT INTO data_points (model_id, user_id, input_data, prediction, created_at) "
                "VALUES ($1, $2, $3, $4, NOW()) "
                "RETURNING id, created_at",
                data_point.model_id, data_point.user_id, data_point.input_data,
                data_point.prediction ? *data_point.prediction : pqxx::null<std::string>()
            );
            txn.commit();

            const auto& row = r[0];
            DataPoint created_dp = data_point;
            created_dp.id = row["id"].as<int>();
            created_dp.created_at = std::chrono::system_clock::from_time_t(row["created_at"].as<std::time_t>());
            LOG_INFO("DataPoint created for model {} by user {}.", created_dp.model_id, created_dp.user_id);
            return created_dp;
        } catch (const pqxx::sql_error& e) {
            LOG_ERROR("SQL Error creating data point for model {} by user {}: {}. Query: {}",
                      data_point.model_id, data_point.user_id, e.what(), e.query());
            throw;
        } catch (const std::exception& e) {
            LOG_ERROR("Error creating data point for model {} by user {}: {}",
                      data_point.model_id, data_point.user_id, e.what());
            throw;
        }
    }

    /**
     * @brief Finds a data point by its ID and associated user.
     * @param id The ID of the data point to find.
     * @param user_id The ID of the user who owns the data point.
     * @return An `std::optional<DataPoint>` if found, `std::nullopt` otherwise.
     */
    std::optional<DataPoint> findDataPointByIdAndUser(int id, int user_id) {
        try {
            ScopedConnection scoped_conn(db_pool.get());
            pqxx::work txn(scoped_conn.get());
            pqxx::result r = txn.exec_params(
                "SELECT id, model_id, user_id, input_data, prediction, created_at "
                "FROM data_points WHERE id = $1 AND user_id = $2",
                id, user_id
            );

            if (r.empty()) {
                LOG_DEBUG("DataPoint with ID {} for user {} not found.", id, user_id);
                return std::nullopt;
            }

            const auto& row = r[0];
            std::optional<std::string> prediction_opt;
            if (row["prediction"].is_null() == false) {
                prediction_opt = row["prediction"].as<std::string>();
            }

            return DataPoint{
                row["id"].as<int>(),
                row["model_id"].as<int>(),
                row["user_id"].as<int>(),
                row["input_data"].as<std::string>(),
                prediction_opt,
                std::chrono::system_clock::from_time_t(row["created_at"].as<std::time_t>())
            };
        } catch (const pqxx::sql_error& e) {
            LOG_ERROR("SQL Error finding data point {} for user {}: {}. Query: {}", id, user_id, e.what(), e.query());
            throw;
        } catch (const std::exception& e) {
            LOG_ERROR("Error finding data point {} for user {}: {}", id, user_id, e.what());
            throw;
        }
    }

    /**
     * @brief Finds all data points associated with a specific model and user.
     * @param model_id The ID of the model.
     * @param user_id The ID of the user.
     * @return A vector of DataPoint objects.
     */
    std::vector<DataPoint> findDataPointsByModelAndUser(int model_id, int user_id) {
        std::vector<DataPoint> data_points;
        try {
            ScopedConnection scoped_conn(db_pool.get());
            pqxx::work txn(scoped_conn.get());
            pqxx::result r = txn.exec_params(
                "SELECT id, model_id, user_id, input_data, prediction, created_at "
                "FROM data_points WHERE model_id = $1 AND user_id = $2 ORDER BY created_at DESC",
                model_id, user_id
            );

            for (const auto& row : r) {
                std::optional<std::string> prediction_opt;
                if (row["prediction"].is_null() == false) {
                    prediction_opt = row["prediction"].as<std::string>();
                }
                data_points.push_back({
                    row["id"].as<int>(),
                    row["model_id"].as<int>(),
                    row["user_id"].as<int>(),
                    row["input_data"].as<std::string>(),
                    prediction_opt,
                    std::chrono::system_clock::from_time_t(row["created_at"].as<std::time_t>())
                });
            }
            LOG_DEBUG("Found {} data points for model {} by user {}.", data_points.size(), model_id, user_id);
        } catch (const pqxx::sql_error& e) {
            LOG_ERROR("SQL Error finding data points for model {} by user {}: {}. Query: {}",
                      model_id, user_id, e.what(), e.query());
            throw;
        } catch (const std::exception& e) {
            LOG_ERROR("Error finding data points for model {} by user {}: {}",
                      model_id, user_id, e.what());
            throw;
        }
        return data_points;
    }
};

#endif // ML_UTILITIES_SYSTEM_MODEL_REPOSITORY_HPP
```