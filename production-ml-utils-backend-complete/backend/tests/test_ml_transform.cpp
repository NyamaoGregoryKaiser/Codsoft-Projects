#include <catch2/catch_test_macros.hpp>
#include "services/MLTransformService.h"
#include "models/MLTransformConfig.h"
#include "common/ErrorHandling.h"
#include <vector>
#include <cmath>

// Helper to compare double values with a tolerance
bool are_close(double a, double b, double epsilon = 1e-9) {
    return std::abs(a - b) < epsilon;
}

TEST_CASE("MLTransformService StandardScaler", "[MLTransformService][Scaler]") {
    MLTransformService service;

    SECTION("StandardScaler on simple data") {
        TransformData input;
        input.features = {
            {1.0, 10.0},
            {2.0, 20.0},
            {3.0, 30.0}
        };
        input.feature_names = {"feature_A", "feature_B"};

        TransformData output = service.applyStandardScaler(input);

        REQUIRE(output.features.size() == 3);
        REQUIRE(output.features[0].size() == 2);
        REQUIRE(output.feature_names == input.feature_names);

        // Expected values for column 1: (1, 2, 3) -> mean 2, std dev sqrt(2/3) ~ 0.816
        // Scaled: (-1.224, 0, 1.224)
        REQUIRE(are_close(output.features[0][0], -1.224744871));
        REQUIRE(are_close(output.features[1][0], 0.0));
        REQUIRE(are_close(output.features[2][0], 1.224744871));

        // Expected values for column 2: (10, 20, 30) -> mean 20, std dev sqrt(200/3) ~ 8.16
        // Scaled: (-1.224, 0, 1.224)
        REQUIRE(are_close(output.features[0][1], -1.224744871));
        REQUIRE(are_close(output.features[1][1], 0.0));
        REQUIRE(are_close(output.features[2][1], 1.224744871));
    }

    SECTION("StandardScaler with constant feature") {
        TransformData input;
        input.features = {
            {1.0, 5.0},
            {1.0, 6.0},
            {1.0, 7.0}
        };
        input.feature_names = {"const_feature", "var_feature"};

        TransformData output = service.applyStandardScaler(input);

        REQUIRE(output.features.size() == 3);
        REQUIRE(output.features[0].size() == 2);

        // Constant feature (1.0, 1.0, 1.0) should become (0.0, 0.0, 0.0)
        REQUIRE(are_close(output.features[0][0], 0.0));
        REQUIRE(are_close(output.features[1][0], 0.0));
        REQUIRE(are_close(output.features[2][0], 0.0));

        // Variable feature (5.0, 6.0, 7.0) -> mean 6, std dev sqrt(2/3) ~ 0.816
        // Scaled: (-1.224, 0, 1.224)
        REQUIRE(are_close(output.features[0][1], -1.224744871));
        REQUIRE(are_close(output.features[1][1], 0.0));
        REQUIRE(are_close(output.features[2][1], 1.224744871));
    }

    SECTION("StandardScaler with empty input data throws BadRequestError") {
        TransformData input;
        input.features = {};
        REQUIRE_THROWS_AS(service.applyStandardScaler(input), BadRequestError);

        input.features = {{}};
        REQUIRE_THROWS_AS(service.applyStandardScaler(input), BadRequestError);
    }
}

TEST_CASE("MLTransformService MinMaxScaler", "[MLTransformService][Scaler]") {
    MLTransformService service;

    SECTION("MinMaxScaler on simple data") {
        TransformData input;
        input.features = {
            {1.0, 10.0},
            {2.0, 20.0},
            {3.0, 30.0}
        };
        input.feature_names = {"feature_X", "feature_Y"};

        TransformData output = service.applyMinMaxScaler(input);

        REQUIRE(output.features.size() == 3);
        REQUIRE(output.features[0].size() == 2);
        REQUIRE(output.feature_names == input.feature_names);

        // Expected values for column 1: (1, 2, 3) -> min 1, max 3, range 2
        // Scaled: ((1-1)/2=0, (2-1)/2=0.5, (3-1)/2=1)
        REQUIRE(are_close(output.features[0][0], 0.0));
        REQUIRE(are_close(output.features[1][0], 0.5));
        REQUIRE(are_close(output.features[2][0], 1.0));

        // Expected values for column 2: (10, 20, 30) -> min 10, max 30, range 20
        // Scaled: ((10-10)/20=0, (20-10)/20=0.5, (30-10)/20=1)
        REQUIRE(are_close(output.features[0][1], 0.0));
        REQUIRE(are_close(output.features[1][1], 0.5));
        REQUIRE(are_close(output.features[2][1], 1.0));
    }

    SECTION("MinMaxScaler with constant feature") {
        TransformData input;
        input.features = {
            {5.0, 10.0},
            {5.0, 20.0},
            {5.0, 30.0}
        };
        input.feature_names = {"const_feature", "var_feature"};

        TransformData output = service.applyMinMaxScaler(input);

        REQUIRE(output.features.size() == 3);
        REQUIRE(output.features[0].size() == 2);

        // Constant feature (5.0, 5.0, 5.0) should become (0.5, 0.5, 0.5) (our logic)
        REQUIRE(are_close(output.features[0][0], 0.5));
        REQUIRE(are_close(output.features[1][0], 0.5));
        REQUIRE(are_close(output.features[2][0], 0.5));

        // Variable feature (10.0, 20.0, 30.0) -> min 10, max 30, range 20
        // Scaled: (0, 0.5, 1)
        REQUIRE(are_close(output.features[0][1], 0.0));
        REQUIRE(are_close(output.features[1][1], 0.5));
        REQUIRE(are_close(output.features[2][1], 1.0));
    }

    SECTION("MinMaxScaler with empty input data throws BadRequestError") {
        TransformData input;
        input.features = {};
        REQUIRE_THROWS_AS(service.applyMinMaxScaler(input), BadRequestError);

        input.features = {{}};
        REQUIRE_THROWS_AS(service.applyMinMaxScaler(input), BadRequestError);
    }
}

TEST_CASE("MLTransformService mockPrediction", "[MLTransformService][Prediction]") {
    MLTransformService service;
    nlohmann::json input_features = {{"feature1", 10}, {"feature2", 20.5}};

    SECTION("Mock prediction for known model ID (Churn)") {
        nlohmann::json result = service.mockPrediction("a0000000-0000-4000-8000-000000000000", input_features);
        REQUIRE(result["model_id"] == "a0000000-0000-4000-8000-000000000000");
        REQUIRE(result["prediction"] == "No Churn");
        REQUIRE(are_close(result["probability"].get<double>(), 0.82));
    }

    SECTION("Mock prediction for known model ID (Fraud)") {
        nlohmann::json result = service.mockPrediction("a1111111-1111-4111-8111-111111111111", input_features);
        REQUIRE(result["model_id"] == "a1111111-1111-4111-8111-111111111111");
        REQUIRE(result["prediction"] == "Not Fraud");
        REQUIRE(are_close(result["score"].get<double>(), 0.15));
    }

    SECTION("Mock prediction for unknown model ID") {
        nlohmann::json result = service.mockPrediction(UUID::generate_uuid_v4(), input_features);
        REQUIRE(result["prediction"] == "Unknown");
        REQUIRE(result.contains("message"));
    }
}
```