```cpp
#include "gtest/gtest.h"
#include "../../src/database/DatabaseManager.h"
#include "../../src/utils/Types.h"
#include "../../src/utils/Logger.h"
#include <filesystem>

using namespace mlops;
using namespace mlops::database;
using namespace mlops::utils;

namespace fs = std::filesystem;

class DatabaseManagerTest : public ::testing::Test {
protected:
    std::string test_db_path = "./data/test_mlops.db";
    std::unique_ptr<DatabaseManager> db_manager;

    void SetUp() override {
        // Ensure the directory exists
        fs::create_directories(fs::path(test_db_path).parent_path());
        // Clean up any previous test database
        if (fs::exists(test_db_path)) {
            fs::remove(test_db_path);
        }
        Logger::getInstance().init("/dev/null", LogLevel::ERROR); // Suppress log output during tests
        db_manager = std::make_unique<DatabaseManager>(test_db_path);
    }

    void TearDown() override {
        db_manager.reset(); // Close DB connection
        if (fs::exists(test_db_path)) {
            fs::remove(test_db_path);
        }
    }

    ModelDTO createSampleModelDTO(const std::string& name, const std::string& desc) {
        ModelDTO dto;
        dto.name = name;
        dto.description = desc;
        dto.created_at = getCurrentTimestamp();
        dto.updated_at = getCurrentTimestamp();
        return dto;
    }

    ModelVersionDTO createSampleVersionDTO(int model_id, const std::string& tag, bool active, const ModelParameters& params) {
        ModelVersionDTO dto;
        dto.model_id = model_id;
        dto.version_tag = tag;
        dto.model_path = "/models/path/" + tag;
        dto.created_at = getCurrentTimestamp();
        dto.is_active = active;
        dto.parameters = params;
        dto.notes = "Notes for " + tag;
        return dto;
    }

    PredictionLogDTO createSampleLogDTO(int version_id, const PredictionInput& input, const PredictionOutput& output, const std::string& status) {
        PredictionLogDTO dto;
        dto.model_version_id = version_id;
        dto.input_data = input;
        dto.output_data = output;
        dto.timestamp = getCurrentTimestamp();
        dto.status = status;
        dto.error_message = (status == "ERROR") ? "Some error" : "";
        return dto;
    }
};

TEST_F(DatabaseManagerTest, CreateAndGetModel) {
    ModelDTO model_to_create = createSampleModelDTO("Test Model", "A model for testing.");
    std::optional<ModelDTO> created_model = db_manager->createModel(model_to_create);
    ASSERT_TRUE(created_model.has_value());
    ASSERT_TRUE(created_model->id.has_value());
    ASSERT_EQ(created_model->name, "Test Model");

    std::optional<ModelDTO> fetched_model = db_manager->getModelById(*created_model->id);
    ASSERT_TRUE(fetched_model.has_value());
    ASSERT_EQ(fetched_model->name, "Test Model");
    ASSERT_EQ(fetched_model->description, "A model for testing.");
}

TEST_F(DatabaseManagerTest, GetAllModels) {
    ModelDTO m1 = createSampleModelDTO("Model A", "Desc A");
    db_manager->createModel(m1);
    ModelDTO m2 = createSampleModelDTO("Model B", "Desc B");
    db_manager->createModel(m2);

    std::vector<ModelDTO> models = db_manager->getModels();
    ASSERT_EQ(models.size(), 2);
    ASSERT_TRUE((models[0].name == "Model A" || models[0].name == "Model B"));
}

TEST_F(DatabaseManagerTest, UpdateModel) {
    ModelDTO model_to_create = createSampleModelDTO("Original Model", "Original Desc");
    std::optional<ModelDTO> created_model = db_manager->createModel(model_to_create);
    ASSERT_TRUE(created_model.has_value());

    ModelDTO update_dto;
    update_dto.name = "Updated Model";
    update_dto.description = "Updated Description";
    std::optional<ModelDTO> updated_model = db_manager->updateModel(*created_model->id, update_dto);
    ASSERT_TRUE(updated_model.has_value());
    ASSERT_EQ(updated_model->name, "Updated Model");
    ASSERT_EQ(updated_model->description, "Updated Description");

    std::optional<ModelDTO> fetched_model = db_manager->getModelById(*created_model->id);
    ASSERT_TRUE(fetched_model.has_value());
    ASSERT_EQ(fetched_model->name, "Updated Model");
}

TEST_F(DatabaseManagerTest, DeleteModel) {
    ModelDTO model_to_create = createSampleModelDTO("Model To Delete", "Desc");
    std::optional<ModelDTO> created_model = db_manager->createModel(model_to_create);
    ASSERT_TRUE(created_model.has_value());
    ASSERT_TRUE(db_manager->getModelById(*created_model->id).has_value());

    db_manager->deleteModel(*created_model->id);
    ASSERT_FALSE(db_manager->getModelById(*created_model->id).has_value());
}

TEST_F(DatabaseManagerTest, CreateAndGetModelVersion) {
    ModelDTO model = createSampleModelDTO("Parent Model", "Desc");
    std::optional<ModelDTO> created_model = db_manager->createModel(model);
    ASSERT_TRUE(created_model.has_value());

    ModelParameters params = {{"coef", 1.0}, {"intercept", 0.5}};
    ModelVersionDTO version_to_create = createSampleVersionDTO(*created_model->id, "v1.0", true, params);
    std::optional<ModelVersionDTO> created_version = db_manager->createModelVersion(version_to_create);
    ASSERT_TRUE(created_version.has_value());
    ASSERT_TRUE(created_version->id.has_value());
    ASSERT_EQ(created_version->version_tag, "v1.0");

    std::optional<ModelVersionDTO> fetched_version = db_manager->getModelVersionById(*created_version->id);
    ASSERT_TRUE(fetched_version.has_value());
    ASSERT_EQ(fetched_version->version_tag, "v1.0");
    ASSERT_TRUE(fetched_version->is_active);
    ASSERT_EQ(fetched_version->parameters.at("coef"), 1.0);
}

TEST_F(DatabaseManagerTest, GetModelVersionByModelAndTag) {
    ModelDTO model = createSampleModelDTO("Test Model For Tag", "Desc");
    std::optional<ModelDTO> created_model = db_manager->createModel(model);
    ASSERT_TRUE(created_model.has_value());

    ModelParameters params1 = {{"coef", 1.0}};
    ModelVersionDTO v1 = createSampleVersionDTO(*created_model->id, "alpha", true, params1);
    db_manager->createModelVersion(v1);

    ModelParameters params2 = {{"coef", 2.0}};
    ModelVersionDTO v2 = createSampleVersionDTO(*created_model->id, "beta", false, params2);
    db_manager->createModelVersion(v2);

    std::optional<ModelVersionDTO> fetched_v1 = db_manager->getModelVersionByModelAndTag(*created_model->id, "alpha");
    ASSERT_TRUE(fetched_v1.has_value());
    ASSERT_EQ(fetched_v1->version_tag, "alpha");
    ASSERT_NEAR(fetched_v1->parameters.at("coef"), 1.0, 1e-6);

    std::optional<ModelVersionDTO> fetched_v_non_existent = db_manager->getModelVersionByModelAndTag(*created_model->id, "gamma");
    ASSERT_FALSE(fetched_v_non_existent.has_value());
}

TEST_F(DatabaseManagerTest, UpdateModelVersion) {
    ModelDTO model = createSampleModelDTO("Model for Version Update", "Desc");
    std::optional<ModelDTO> created_model = db_manager->createModel(model);
    ASSERT_TRUE(created_model.has_value());

    ModelParameters initial_params = {{"coef", 1.0}};
    ModelVersionDTO version_to_create = createSampleVersionDTO(*created_model->id, "v1.0", false, initial_params);
    std::optional<ModelVersionDTO> created_version = db_manager->createModelVersion(version_to_create);
    ASSERT_TRUE(created_version.has_value());

    ModelParameters updated_params = {{"coef", 2.0}, {"intercept", 10.0}};
    ModelVersionDTO update_dto;
    update_dto.version_tag = "v1.0-updated";
    update_dto.model_path = "/new/path";
    update_dto.is_active = true;
    update_dto.parameters = updated_params;
    update_dto.notes = "Updated notes";

    std::optional<ModelVersionDTO> updated_version = db_manager->updateModelVersion(*created_version->id, update_dto);
    ASSERT_TRUE(updated_version.has_value());
    ASSERT_EQ(updated_version->version_tag, "v1.0-updated");
    ASSERT_TRUE(updated_version->is_active);
    ASSERT_EQ(updated_version->parameters.at("coef"), 2.0);
    ASSERT_EQ(updated_version->parameters.at("intercept"), 10.0);

    // Verify original model_id is preserved
    ASSERT_EQ(*updated_version->model_id, *created_model->id);
}

TEST_F(DatabaseManagerTest, DeactivateAllModelVersions) {
    ModelDTO model = createSampleModelDTO("Model for Deactivation", "Desc");
    std::optional<ModelDTO> created_model = db_manager->createModel(model);
    ASSERT_TRUE(created_model.has_value());

    db_manager->createModelVersion(createSampleVersionDTO(*created_model->id, "v1", true, {}));
    db_manager->createModelVersion(createSampleVersionDTO(*created_model->id, "v2", true, {}));
    db_manager->createModelVersion(createSampleVersionDTO(*created_model->id, "v3", false, {}));

    std::vector<ModelVersionDTO> versions_before = db_manager->getModelVersions(*created_model->id);
    ASSERT_EQ(versions_before.size(), 3);
    int active_count = 0;
    for (const auto& v : versions_before) {
        if (v.is_active) active_count++;
    }
    ASSERT_EQ(active_count, 2);

    db_manager->deactivateAllModelVersions(*created_model->id);

    std::vector<ModelVersionDTO> versions_after = db_manager->getModelVersions(*created_model->id);
    active_count = 0;
    for (const auto& v : versions_after) {
        if (v.is_active) active_count++;
    }
    ASSERT_EQ(active_count, 0);
}

TEST_F(DatabaseManagerTest, DeleteModelVersionCascade) {
    ModelDTO model = createSampleModelDTO("Parent Model for Version Delete", "Desc");
    std::optional<ModelDTO> created_model = db_manager->createModel(model);
    ASSERT_TRUE(created_model.has_value());

    ModelParameters params = {{"c", 1}};
    ModelVersionDTO version_to_create = createSampleVersionDTO(*created_model->id, "v1.0", true, params);
    std::optional<ModelVersionDTO> created_version = db_manager->createModelVersion(version_to_create);
    ASSERT_TRUE(created_version.has_value());
    ASSERT_TRUE(db_manager->getModelVersionById(*created_version->id).has_value());

    db_manager->deleteModelVersion(*created_version->id);
    ASSERT_FALSE(db_manager->getModelVersionById(*created_version->id).has_value());
    // Parent model should still exist
    ASSERT_TRUE(db_manager->getModelById(*created_model->id).has_value());
}

TEST_F(DatabaseManagerTest, CreateAndGetPredictionLog) {
    ModelDTO model = createSampleModelDTO("Model for Pred Log", "Desc");
    std::optional<ModelDTO> created_model = db_manager->createModel(model);
    ASSERT_TRUE(created_model.has_value());

    ModelParameters params = {{"c", 1}};
    ModelVersionDTO version = createSampleVersionDTO(*created_model->id, "v1.0", true, params);
    std::optional<ModelVersionDTO> created_version = db_manager->createModelVersion(version);
    ASSERT_TRUE(created_version.has_value());

    PredictionInput input = {{"f1", 10.0}};
    PredictionOutput output = {{"res", 20.0}};
    PredictionLogDTO log_to_create = createSampleLogDTO(*created_version->id, input, output, "SUCCESS");
    std::optional<PredictionLogDTO> created_log = db_manager->createPredictionLog(log_to_create);
    ASSERT_TRUE(created_log.has_value());
    ASSERT_TRUE(created_log->id.has_value());
    ASSERT_EQ(created_log->status, "SUCCESS");
    ASSERT_EQ(created_log->input_data.at("f1"), 10.0);
    ASSERT_EQ(created_log->output_data.at("res"), 20.0);

    std::vector<PredictionLogDTO> logs = db_manager->getPredictionLogs(*created_version->id);
    ASSERT_EQ(logs.size(), 1);
    ASSERT_EQ(logs[0].status, "SUCCESS");
}

TEST_F(DatabaseManagerTest, GetPredictionLogsEmpty) {
    ModelDTO model = createSampleModelDTO("Model without Logs", "Desc");
    std::optional<ModelDTO> created_model = db_manager->createModel(model);
    ASSERT_TRUE(created_model.has_value());

    ModelParameters params = {{"c", 1}};
    ModelVersionDTO version = createSampleVersionDTO(*created_model->id, "v1.0", true, params);
    std::optional<ModelVersionDTO> created_version = db_manager->createModelVersion(version);
    ASSERT_TRUE(created_version.has_value());

    std::vector<PredictionLogDTO> logs = db_manager->getPredictionLogs(*created_version->id);
    ASSERT_TRUE(logs.empty());
}
```