#include "gtest/gtest.h"
#include "../../services/ml_service.hpp"
#include "../../repositories/model_repository.hpp"
#include "../../repositories/db_connection.hpp"
#include "../../utils/cache_manager.hpp"
#include "../../utils/logger.hpp"
#include "../../config/config.hpp"
#include <memory>
#include <stdexcept>
#include <chrono>

// Mock DBConnectionPool (same as in auth_service_test.cpp)
class MockDBConnectionPool : public DBConnectionPool {
public:
    MockDBConnectionPool() : DBConnectionPool("host=mock port=1 user=mock dbname=mock password=mock", 1) {}
    std::unique_ptr<DBConnection> acquireConnection() override {
        return std::make_unique<DBConnection>("host=mock port=1 user=mock dbname=mock password=mock");
    }
    void releaseConnection(std::unique_ptr<DBConnection> conn) override { (void)conn; }
};

// Mock ModelRepository for tests
class MockModelRepository : public ModelRepository {
public:
    MockModelRepository(std::shared_ptr<DBConnectionPool> pool) : ModelRepository(std::move(pool)) {}

    MOCK_METHOD(MLModel, createModel, (const MLModel&), (override));
    MOCK_METHOD(std::optional<MLModel>, findModelById, (int), (override));
    MOCK_METHOD(std::vector<MLModel>, findModelsByOwner, (int), (override));
    MOCK_METHOD(std::vector<MLModel>, findAllModels, (), (override));
    MOCK_METHOD(bool, updateModel, (const MLModel&), (override));
    MOCK_METHOD(bool, deleteModel, (int, int), (override));
    MOCK_METHOD(DataPoint, createDataPoint, (const DataPoint&), (override));
    MOCK_METHOD(std::optional<DataPoint>, findDataPointByIdAndUser, (int, int), (override));
    MOCK_METHOD(std::vector<DataPoint>, findDataPointsByModelAndUser, (int, int), (override));
};

// Test fixture for MLService
class MLServiceTest : public ::testing::Test {
protected:
    std::shared_ptr<MockDBConnectionPool> mock_db_pool;
    std::shared_ptr<MockModelRepository> mock_model_repo;
    std::shared_ptr<MLService> ml_service;

    void SetUp() override {
        Logger::init();
        Config::loadFromEnv();
        CacheManager::init(60); // 60 seconds TTL for tests

        mock_db_pool = std::make_shared<MockDBConnectionPool>();
        mock_model_repo = std::make_shared<MockModelRepository>(mock_db_pool);
        ml_service = std::make_shared<MLService>(mock_model_repo);

        CacheManager::clear(); // Clear cache before each test
    }

    void TearDown() override {
        CacheManager::clear();
    }
};

TEST_F(MLServiceTest, RegisterModelSuccess) {
    MLModel new_model{0, "test_model", "1.0", "classification", "/path/to/model", "desc", 1, {}, std::nullopt};
    MLModel created_model = new_model;
    created_model.id = 1;
    created_model.created_at = std::chrono::system_clock::now();

    EXPECT_CALL(*mock_model_repo, createModel(::testing::_))
        .WillOnce(::testing::Return(created_model));

    MLModel result = ml_service->registerModel("test_model", "1.0", "classification", "/path/to/model", "desc", 1, std::nullopt);
    ASSERT_EQ(result.id, 1);
    ASSERT_EQ(result.name, "test_model");
}

TEST_F(MLServiceTest, GetModelByIdFromDB) {
    MLModel mock_model{1, "test_model", "1.0", "classification", "/path/to/model", "desc", 1, std::chrono::system_clock::now(), std::nullopt};

    EXPECT_CALL(*mock_model_repo, findModelById(1))
        .WillOnce(::testing::Return(mock_model));

    std::optional<MLModel> result = ml_service->getModelById(1);
    ASSERT_TRUE(result.has_value());
    ASSERT_EQ(result->id, 1);
    ASSERT_EQ(result->name, "test_model");
}

TEST_F(MLServiceTest, GetModelByIdFromCache) {
    MLModel mock_model{2, "cached_model", "2.0", "regression", "/path/to/cached", "desc", 2, std::chrono::system_clock::now(), std::nullopt};
    CacheManager::set("model_2", mock_model.toJson().dump());

    // Expect no call to repository as it should be cached
    EXPECT_CALL(*mock_model_repo, findModelById(2))
        .Times(0);

    std::optional<MLModel> result = ml_service->getModelById(2);
    ASSERT_TRUE(result.has_value());
    ASSERT_EQ(result->id, 2);
    ASSERT_EQ(result->name, "cached_model");
}

TEST_F(MLServiceTest, UpdateModelSuccess) {
    MLModel existing_model{3, "old_name", "1.0", "type", "/path", "desc", 10, std::chrono::system_clock::now(), std::nullopt};
    MLModel updated_model = existing_model;
    updated_model.name = "new_name";

    EXPECT_CALL(*mock_model_repo, findModelById(3))
        .WillOnce(::testing::Return(existing_model))
        .WillOnce(::testing::Return(updated_model)); // For refetch after update
    EXPECT_CALL(*mock_model_repo, updateModel(::testing::Field(&MLModel::name, "new_name")))
        .WillOnce(::testing::Return(true));

    MLModel result = ml_service->updateModel(3, 10, "new_name", std::nullopt, std::nullopt, std::nullopt, std::nullopt, std::nullopt);
    ASSERT_EQ(result.name, "new_name");
}

TEST_F(MLServiceTest, DeleteModelSuccess) {
    MLModel existing_model{4, "deletable_model", "1.0", "type", "/path", "desc", 10, std::chrono::system_clock::now(), std::nullopt};

    EXPECT_CALL(*mock_model_repo, findModelById(4))
        .WillOnce(::testing::Return(existing_model));
    EXPECT_CALL(*mock_model_repo, deleteModel(4, 10))
        .WillOnce(::testing::Return(true));

    bool result = ml_service->deleteModel(4, 10);
    ASSERT_TRUE(result);
}

TEST_F(MLServiceTest, PerformInferenceSuccess) {
    MLModel mock_model{5, "inference_model", "1.0", "classification", "/path/to/infer", "desc", 1, std::chrono::system_clock::now(), std::nullopt};
    DataPoint expected_dp{1, 5, 1, R"({"feature1":10})", R"({"prediction":"class_A","probability":0.95})", std::chrono::system_clock::now()};

    EXPECT_CALL(*mock_model_repo, findModelById(5))
        .WillOnce(::testing::Return(mock_model));
    EXPECT_CALL(*mock_model_repo, createDataPoint(::testing::_))
        .WillOnce(::testing::Return(expected_dp));

    DataPoint result = ml_service->performInference(5, 1, R"({"feature1":10})");
    ASSERT_EQ(result.model_id, 5);
    ASSERT_EQ(result.user_id, 1);
    ASSERT_EQ(*result.prediction, R"({"prediction":"class_A","probability":0.95})");
}

TEST_F(MLServiceTest, PerformInferenceModelNotFound) {
    EXPECT_CALL(*mock_model_repo, findModelById(99))
        .WillOnce(::testing::Return(std::nullopt));

    ASSERT_THROW(ml_service->performInference(99, 1, R"({"feature1":10})"), std::runtime_error);
}
```