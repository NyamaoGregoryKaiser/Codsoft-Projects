#include "MLTransformService.h"
#include "common/ErrorHandling.h"
#include "spdlog/spdlog.h"
#include <numeric> // For std::accumulate
#include <cmath>   // For std::sqrt

TransformData MLTransformService::applyStandardScaler(const TransformData& input_data) {
    if (input_data.features.empty() || input_data.features[0].empty()) {
        throw BadRequestError("Input data for StandardScaler is empty.");
    }

    TransformData output_data = input_data; // Copy original data structure
    size_t num_samples = input_data.features.size();
    size_t num_features = input_data.features[0].size();

    for (size_t j = 0; j < num_features; ++j) { // Iterate over each feature (column)
        std::vector<double> feature_column;
        for (size_t i = 0; i < num_samples; ++i) {
            feature_column.push_back(input_data.features[i][j]);
        }

        // Calculate mean
        double sum = std::accumulate(feature_column.begin(), feature_column.end(), 0.0);
        double mean = sum / num_samples;

        // Calculate standard deviation
        double sq_sum = std::inner_product(feature_column.begin(), feature_column.end(), feature_column.begin(), 0.0);
        double std_dev = std::sqrt((sq_sum / num_samples) - (mean * mean));

        // Apply scaling
        if (std_dev < 1e-9) { // Handle zero standard deviation (constant feature)
            spdlog::warn("StandardScaler: Feature {} has zero standard deviation. Values will be set to 0.", j);
            for (size_t i = 0; i < num_samples; ++i) {
                output_data.features[i][j] = 0.0;
            }
        } else {
            for (size_t i = 0; i < num_samples; ++i) {
                output_data.features[i][j] = (input_data.features[i][j] - mean) / std_dev;
            }
        }
    }
    spdlog::info("StandardScaler applied to data with {} samples and {} features.", num_samples, num_features);
    return output_data;
}

TransformData MLTransformService::applyMinMaxScaler(const TransformData& input_data) {
    if (input_data.features.empty() || input_data.features[0].empty()) {
        throw BadRequestError("Input data for MinMaxScaler is empty.");
    }

    TransformData output_data = input_data; // Copy original data structure
    size_t num_samples = input_data.features.size();
    size_t num_features = input_data.features[0].size();

    for (size_t j = 0; j < num_features; ++j) { // Iterate over each feature (column)
        double min_val = input_data.features[0][j];
        double max_val = input_data.features[0][j];

        for (size_t i = 1; i < num_samples; ++i) {
            if (input_data.features[i][j] < min_val) min_val = input_data.features[i][j];
            if (input_data.features[i][j] > max_val) max_val = input_data.features[i][j];
        }

        double range = max_val - min_val;

        // Apply scaling
        if (range < 1e-9) { // Handle zero range (constant feature)
            spdlog::warn("MinMaxScaler: Feature {} has zero range. Values will be set to 0.0 (if min_val=0) or 1.0 (if min_val!=0).", j);
            for (size_t i = 0; i < num_samples; ++i) {
                // If all values are the same, they typically map to 0.5 or 0, depending on implementation.
                // Here, we set to 0.0 (or keep original if min_val is also 0).
                output_data.features[i][j] = (min_val == 0.0) ? 0.0 : 0.5; // Or some other consistent value
            }
        } else {
            for (size_t i = 0; i < num_samples; ++i) {
                output_data.features[i][j] = (input_data.features[i][j] - min_val) / range;
            }
        }
    }
    spdlog::info("MinMaxScaler applied to data with {} samples and {} features.", num_samples, num_features);
    return output_data;
}

nlohmann::json MLTransformService::mockPrediction(const std::string& model_id, const nlohmann::json& input_features) {
    spdlog::info("Mock prediction requested for model ID: {}", model_id);

    // In a real system:
    // 1. Load the model identified by model_id (from disk, S3, model registry cache).
    // 2. Preprocess input_features according to the model's requirements.
    // 3. Run inference using the loaded model.
    // 4. Post-process the output (e.g., convert probabilities to labels).

    // For this mock, we'll just return a dummy prediction based on model_id
    nlohmann::json result;
    result["model_id"] = model_id;
    result["input_features"] = input_features;

    if (model_id == "a0000000-0000-4000-8000-000000000000") { // Churn Prediction
        result["prediction"] = "No Churn";
        result["probability"] = 0.82;
        result["confidence"] = 0.95;
    } else if (model_id == "a1111111-1111-4111-8111-111111111111") { // Fraud Detection
        result["prediction"] = "Not Fraud";
        result["score"] = 0.15;
        result["threshold_met"] = false;
    } else {
        result["prediction"] = "Unknown";
        result["confidence"] = 0.5;
        result["message"] = "Mock prediction for unknown model ID.";
    }

    return result;
}
```