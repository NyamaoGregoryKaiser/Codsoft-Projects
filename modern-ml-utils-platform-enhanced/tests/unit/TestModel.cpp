```cpp
#include "gtest/gtest.h"
#include "../../src/core/Model.h"
#include "../../src/utils/Types.h"
#include "../../src/utils/Logger.h" // For disabling actual logging in tests

using namespace mlops;
using namespace mlops::core;
using namespace mlops::utils;

// Helper to set up dummy logger for tests
struct GlobalTestSetup {
    GlobalTestSetup() {
        Logger::getInstance().init("/dev/null", LogLevel::ERROR); // Suppress log output during tests
    }
};

GlobalTestSetup g_test_setup;

TEST(LinearRegressionModelTest, LoadAndPredictSimple) {
    auto model = ModelFactory::createModel("linear_regression");
    ModelParameters params = {
        {"intercept", 10.0},
        {"coef_featureA", 2.0},
        {"coef_featureB", -0.5}
    };
    model->load("", params); // model_path is not used by dummy LinearRegressionModel

    PredictionInput input1 = {{"featureA", 5.0}, {"featureB", 10.0}};
    PredictionOutput output1 = model->predict(input1);
    ASSERT_EQ(output1.size(), 1);
    ASSERT_TRUE(output1.count("predicted_value"));
    // Expected: 10.0 + (2.0 * 5.0) + (-0.5 * 10.0) = 10.0 + 10.0 - 5.0 = 15.0
    ASSERT_NEAR(output1["predicted_value"], 15.0, 1e-6);

    PredictionInput input2 = {{"featureA", 0.0}, {"featureB", 0.0}};
    PredictionOutput output2 = model->predict(input2);
    ASSERT_NEAR(output2["predicted_value"], 10.0, 1e-6); // Only intercept
}

TEST(LinearRegressionModelTest, PredictMissingFeatures) {
    auto model = ModelFactory::createModel("linear_regression");
    ModelParameters params = {
        {"intercept", 0.0},
        {"coef_x", 3.0}
    };
    model->load("", params);

    PredictionInput input = {{"y", 100.0}}; // 'x' is missing
    PredictionOutput output = model->predict(input);
    // 'x' will be treated as 0, so prediction is 0.0 + 3.0 * 0.0 = 0.0
    ASSERT_NEAR(output["predicted_value"], 0.0, 1e-6);
}

TEST(LinearRegressionModelTest, GetParameters) {
    auto model = ModelFactory::createModel("linear_regression");
    ModelParameters params = {
        {"intercept", 1.0},
        {"coef_f1", 0.1},
        {"coef_f2", 0.2}
    };
    model->load("", params);

    ModelParameters retrieved_params = model->getParameters();
    ASSERT_EQ(retrieved_params.size(), 3);
    ASSERT_NEAR(retrieved_params["intercept"], 1.0, 1e-6);
    ASSERT_NEAR(retrieved_params["coef_f1"], 0.1, 1e-6);
    ASSERT_NEAR(retrieved_params["coef_f2"], 0.2, 1e-6);
}

TEST(ModelFactoryTest, CreateUnknownModelType) {
    // Should default to LinearRegression and log a warning
    auto model = ModelFactory::createModel("unknown_model_type");
    ASSERT_NE(model, nullptr);
    // You could try to dynamic_cast to check the actual type if needed
    ASSERT_TRUE(dynamic_cast<LinearRegressionModel*>(model.get()) != nullptr);
}
```