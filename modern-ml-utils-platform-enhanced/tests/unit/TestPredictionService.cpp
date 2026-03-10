```cpp
#include "gtest/gtest.h"
#include "gmock/gmock.h"
#include "../../src/core/PredictionService.h"
#include "../../src/database/DatabaseManager.h" // Need the concrete DBManager for mocking or direct use
#include "../../src/utils/Types.h"
#include "../../src/utils/Logger.h"
#include <memory>
#include <filesystem>

using namespace mlops;
using namespace mlops::core;
using namespace mlops::database;
using namespace mlops::utils;
using ::testing::_;
using ::testing::Return;
using ::testing::ByRef;
using ::testing::NiceMock;

namespace fs = std::filesystem;

// Mock for DatabaseManager if needed for isolation, but for simplicity
// and demonstration of interaction, we'll use a real one with a test DB.
// If you want a mock, it would look like this:
/*
class MockDatabaseManager : public DatabaseManager {
public:
    MockDatabaseManager(const std::string& path) : DatabaseManager(path) {} // Call base constructor
    MOCK_METHOD(std::optional<ModelVersionDTO>, getModelVersionById, (int id), (override));
    MOCK_METHOD(std::optional<ModelVersionDTO>, getModelVersionByModelAndTag, (int model_id, const std::string& version_tag), (override));
    MOCK_METHOD(std::optional<PredictionLogDTO>, createPredictionLog, (PredictionLogDTO& log_dto), (override));
    // Add other mocks as needed
};
*/

class PredictionServiceTest : public ::testing::Test {
protected:
    std::string test_db_path = "./data/test_prediction_service.db";
    std::shared_ptr<DatabaseManager> db_manager;
    std::unique_ptr<PredictionService> prediction_service;

    // Helper to create models and versions in the test database
    ModelVersionDTO setupDummyModelAndVersion(const std::string& model_name, const std::string& version_tag, bool is_active) {
        ModelDTO model_dto;
        model_dto.name = model_name;
        model_dto.description = "Test Model";
        model_dto.created_at = getCurrentTimestamp();
        model_dto.updated_at = getCurrentTimestamp();
        auto created_model = db_manager->createModel(model_dto);
        EXPECT_TRUE(created_model.has_value());

        ModelParameters params = {{"intercept", 100.0}, {"coef_featureA", 2.0}};
        ModelVersionDTO version_dto;
        version_dto.model_id = *created_model->id;
        version_dto.version_tag = version_tag;
        version_dto.model_path = "/dummy/path";
        version_dto.created_at = getCurrentTimestamp();
        version_dto.is_active = is_active;
        version_dto.parameters = params;
        version_dto.notes = "Test Version";
        auto created_version = db_manager->createModelVersion(version_dto);
        EXPECT_TRUE(created_version.has_value());
        return *created_version;
    }

    void SetUp() override {
        // Ensure the directory exists
        fs::create_directories(fs::path(test_db_path).parent_path());
        // Clean up any previous test database
        if (fs::exists(test_db_path)) {
            fs::remove(test_db_path);
        }
        Logger::getInstance().init("/dev/null", LogLevel::ERROR); // Suppress log output during tests
        db_manager = std::make_shared<DatabaseManager>(test_db_path);
        prediction_service = std::make_unique<PredictionService>(db_manager, 5); // Cache capacity 5
    }

    void TearDown() override {
        prediction_service.reset();
        db_manager.reset();
        if (fs::exists(test_db_path)) {
            fs::remove(test_db_path);
        }
    }
};

TEST_F(PredictionServiceTest, PredictByIdSuccess) {
    ModelVersionDTO version = setupDummyModelAndVersion("Model1", "v1.0", true);
    PredictionInput input = {{"featureA", 10.0}};

    PredictionOutput output = prediction_service->predict(*version.model_id, *version.id, input);
    // Expected: 100.0 + (2.0 * 10.0) = 120.0
    ASSERT_NEAR(output["predicted_value"], 120.0, 1e-6);

    // Verify prediction log was created
    auto logs = db_manager->getPredictionLogs(*version.id);
    ASSERT_EQ(logs.size(), 1);
    ASSERT_EQ(logs[0].status, "SUCCESS");
    ASSERT_NEAR(logs[0].output_data.at("predicted_value"), 120.0, 1e-6);
}

TEST_F(PredictionServiceTest, PredictByIdNotFound) {
    PredictionInput input = {{"featureA", 10.0}};
    ASSERT_THROW(prediction_service->predict(999, 9999, input), std::runtime_error);

    // Verify no prediction log for non-existent version
    auto logs = db_manager->getPredictionLogs(9999);
    ASSERT_TRUE(logs.empty());
}

TEST_F(PredictionServiceTest, PredictByIdInactiveModel) {
    ModelVersionDTO version = setupDummyModelAndVersion("Model2", "v2.0", false); // Inactive
    PredictionInput input = {{"featureA", 10.0}};

    ASSERT_THROW(prediction_service->predict(*version.model_id, *version.id, input), std::runtime_error);

    // Verify prediction log was created with ERROR status
    auto logs = db_manager->getPredictionLogs(*version.id);
    ASSERT_EQ(logs.size(), 1);
    ASSERT_EQ(logs[0].status, "ERROR");
    ASSERT_NE(logs[0].error_message, "");
}

TEST_F(PredictionServiceTest, PredictByVersionTagSuccess) {
    ModelVersionDTO version = setupDummyModelAndVersion("Model3", "v3.0", true);
    PredictionInput input = {{"featureA", 15.0}};

    PredictionOutput output = prediction_service->predictByVersionTag(*version.model_id, "v3.0", input);
    // Expected: 100.0 + (2.0 * 15.0) = 130.0
    ASSERT_NEAR(output["predicted_value"], 130.0, 1e-6);

    // Verify prediction log was created
    auto logs = db_manager->getPredictionLogs(*version.id);
    ASSERT_EQ(logs.size(), 1);
    ASSERT_EQ(logs[0].status, "SUCCESS");
}

TEST_F(PredictionServiceTest, PredictByVersionTagNotFound) {
    ModelVersionDTO version = setupDummyModelAndVersion("Model4", "v4.0", true); // Create one model, but request another tag
    PredictionInput input = {{"featureA", 10.0}};

    ASSERT_THROW(prediction_service->predictByVersionTag(*version.model_id, "non-existent-tag", input), std::runtime_error);
    
    // Check logs for the existing version (should be empty as request for non-existent tag)
    auto logs = db_manager->getPredictionLogs(*version.id);
    ASSERT_TRUE(logs.empty());
}

TEST_F(PredictionServiceTest, ModelReloadOnDeactivation) {
    ModelVersionDTO version = setupDummyModelAndVersion("Model5", "v5.0", true);
    PredictionInput input = {{"featureA", 5.0}};
    
    // First prediction, model loads and caches
    prediction_service->predict(*version.model_id, *version.id, input);

    // Deactivate the model version in DB
    version.is_active = false;
    db_manager->updateModelVersion(*version.id, version);

    // Try predicting again, should throw because it's inactive (even if cached)
    ASSERT_THROW(prediction_service->predict(*version.model_id, *version.id, input), std::runtime_error);

    // Even if it was in memory, the prediction service should check DB status
    // and if not in DB, or inactive, it should fail.
    // The current implementation checks for active status after fetching from DB (or cache initially).
    // If an item is in cache and gets deactivated, the cache entry becomes stale.
    // reloadModelVersion explicitely removes from cache.
}

TEST_F(PredictionServiceTest, ReloadModelVersionInvalidatesCache) {
    ModelVersionDTO version = setupDummyModelAndVersion("Model6", "v6.0", true);
    PredictionInput input = {{"featureA", 1.0}};

    // Predict once to load into cache
    prediction_service->predict(*version.model_id, *version.id, input);

    // Update model parameters in DB (simulate new version data)
    version.parameters["intercept"] = 200.0; // Change intercept
    db_manager->updateModelVersion(*version.id, version);

    // Before reload, prediction would use old cached model (100 + 2*1 = 102)
    PredictionOutput old_output = prediction_service->predict(*version.model_id, *version.id, input);
    ASSERT_NEAR(old_output["predicted_value"], 102.0, 1e-6);

    // Now reload
    prediction_service->reloadModelVersion(*version.id);

    // Next prediction should fetch from DB and use new parameters (200 + 2*1 = 202)
    PredictionOutput new_output = prediction_service->predict(*version.model_id, *version.id, input);
    ASSERT_NEAR(new_output["predicted_value"], 202.0, 1e-6);
}
```