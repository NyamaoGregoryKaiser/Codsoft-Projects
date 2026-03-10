```cpp
#pragma once

#include <string>
#include <vector>
#include <memory>
#include <optional>
#include <sqlite_orm/sqlite_orm.h>
#include "../utils/Types.h"
#include "../utils/Logger.h"
#include "../utils/JsonUtils.h"

namespace mlops {
namespace database {

// Define the ORM objects that map to database tables
struct Model {
    int id;
    std::string name;
    std::string description;
    std::string created_at;
    std::string updated_at;
};

struct ModelVersion {
    int id;
    int model_id;
    std::string version_tag;
    std::string model_path;
    std::string created_at;
    bool is_active;
    std::string parameters_json; // Stored as JSON string
    std::string notes;
};

struct PredictionLog {
    int id;
    int model_version_id;
    std::string input_data_json; // Stored as JSON string
    std::string output_data_json; // Stored as JSON string
    std::string timestamp;
    std::string status;
    std::string error_message;
};

// SQLite ORM storage definition
inline auto initStorage(const std::string& path) {
    using namespace sqlite_orm;
    return make_storage(path,
        make_table("models",
            make_column("id", &Model::id, primary_key().autoincrement()),
            make_column("name", &Model::name, unique()),
            make_column("description", &Model::description),
            make_column("created_at", &Model::created_at),
            make_column("updated_at", &Model::updated_at)
        ),
        make_table("model_versions",
            make_column("id", &ModelVersion::id, primary_key().autoincrement()),
            make_column("model_id", &ModelVersion::model_id),
            make_column("version_tag", &ModelVersion::version_tag),
            make_column("model_path", &ModelVersion::model_path),
            make_column("created_at", &ModelVersion::created_at),
            make_column("is_active", &ModelVersion::is_active),
            make_column("parameters", &ModelVersion::parameters_json),
            make_column("notes", &ModelVersion::notes),
            foreign_key(&ModelVersion::model_id).references(&Model::id).on_delete(cascade()),
            unique(&ModelVersion::model_id, &ModelVersion::version_tag)
        ),
        make_table("prediction_logs",
            make_column("id", &PredictionLog::id, primary_key().autoincrement()),
            make_column("model_version_id", &PredictionLog::model_version_id),
            make_column("input_data", &PredictionLog::input_data_json),
            make_column("output_data", &PredictionLog::output_data_json),
            make_column("timestamp", &PredictionLog::timestamp),
            make_column("status", &PredictionLog::status),
            make_column("error_message", &PredictionLog::error_message),
            foreign_key(&PredictionLog::model_version_id).references(&ModelVersion::id).on_delete(cascade())
        )
    );
}

using Storage = decltype(initStorage(""));

class DatabaseManager {
public:
    DatabaseManager(const std::string& db_path);
    ~DatabaseManager();

    // Model operations
    std::optional<ModelDTO> createModel(ModelDTO& model_dto);
    std::vector<ModelDTO> getModels();
    std::optional<ModelDTO> getModelById(int id);
    std::optional<ModelDTO> updateModel(int id, ModelDTO& model_dto);
    void deleteModel(int id);

    // Model Version operations
    std::optional<ModelVersionDTO> createModelVersion(ModelVersionDTO& version_dto);
    std::vector<ModelVersionDTO> getModelVersions(int model_id);
    std::optional<ModelVersionDTO> getModelVersionById(int id);
    std::optional<ModelVersionDTO> getModelVersionByModelAndTag(int model_id, const std::string& version_tag);
    std::optional<ModelVersionDTO> updateModelVersion(int id, ModelVersionDTO& version_dto);
    void deleteModelVersion(int id);
    void deactivateAllModelVersions(int model_id);


    // Prediction Log operations
    std::optional<PredictionLogDTO> createPredictionLog(PredictionLogDTO& log_dto);
    std::vector<PredictionLogDTO> getPredictionLogs(int model_version_id);

private:
    std::unique_ptr<Storage> storage_;

    ModelDTO toModelDTO(const Model& model);
    Model fromModelDTO(const ModelDTO& dto);
    ModelVersionDTO toModelVersionDTO(const ModelVersion& version);
    ModelVersion fromModelVersionDTO(const ModelVersionDTO& dto);
    PredictionLogDTO toPredictionLogDTO(const PredictionLog& log);
    PredictionLog fromPredictionLogDTO(const PredictionLogDTO& dto);
};

} // namespace database
} // namespace mlops
```