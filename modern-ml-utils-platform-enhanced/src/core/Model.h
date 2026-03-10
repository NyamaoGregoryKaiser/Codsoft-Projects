```cpp
#pragma once

#include <string>
#include <map>
#include <vector>
#include <fstream>
#include <filesystem>
#include <stdexcept>
#include <nlohmann/json.hpp>
#include "../utils/Types.h"
#include "../utils/Logger.h"
#include "../utils/JsonUtils.h"

namespace mlops {
namespace core {

// This is a dummy "model" implementation for demonstration purposes.
// In a real system, this would involve loading actual ML model files
// (e.g., ONNX, TensorFlow SavedModel, PyTorch state_dict) and using
// their respective inference runtimes (ONNX Runtime, LibTorch, TensorFlow C API).
class BaseModel {
public:
    virtual ~BaseModel() = default;
    virtual PredictionOutput predict(const PredictionInput& input) const = 0;
    virtual void load(const std::string& model_path, const ModelParameters& params) = 0;
    virtual ModelParameters getParameters() const = 0;
};

// Dummy Linear Regression Model
class LinearRegressionModel : public BaseModel {
public:
    LinearRegressionModel() : intercept_(0.0) {}

    void load(const std::string& model_path, const ModelParameters& params) override {
        // For this dummy model, we don't actually load a file.
        // We just store the parameters provided in the ModelVersionDTO.
        // In a real scenario, model_path would point to a file containing
        // weights, biases, etc., and this method would deserialize it.

        if (params.count("intercept")) {
            intercept_ = params.at("intercept");
        } else {
            LOG_WARN("LinearRegressionModel loaded without 'intercept' parameter. Defaulting to 0.0.");
            intercept_ = 0.0;
        }

        coefficients_.clear();
        for (const auto& pair : params) {
            if (pair.first.rfind("coef_", 0) == 0) { // Starts with "coef_"
                coefficients_[pair.first.substr(5)] = pair.second; // Store feature name -> coefficient
            }
        }
        LOG_INFO("LinearRegressionModel loaded with " + std::to_string(coefficients_.size()) + " coefficients and intercept " + std::to_string(intercept_));
    }

    PredictionOutput predict(const PredictionInput& input) const override {
        double prediction = intercept_;
        for (const auto& pair : coefficients_) {
            const std::string& feature_name = pair.first;
            double coefficient = pair.second;
            if (input.count(feature_name)) {
                prediction += coefficient * input.at(feature_name);
            } else {
                LOG_WARN("Feature '" + feature_name + "' expected by model but not found in input. Assuming 0.");
            }
        }
        return {{"predicted_value", prediction}};
    }

    ModelParameters getParameters() const override {
        ModelParameters params;
        params["intercept"] = intercept_;
        for (const auto& pair : coefficients_) {
            params["coef_" + pair.first] = pair.second;
        }
        return params;
    }

private:
    double intercept_;
    std::map<std::string, double> coefficients_; // Map feature name to coefficient
};

// Model factory for creating different model types
class ModelFactory {
public:
    static std::unique_ptr<BaseModel> createModel(const std::string& model_type) {
        // This could be extended with an enum or string map for different types
        // For now, we only support one dummy type
        if (model_type == "linear_regression") {
            return std::make_unique<LinearRegressionModel>();
        }
        // Default or throw error for unknown types
        LOG_ERROR("Unknown model type requested: " + model_type + ". Defaulting to LinearRegression.");
        return std::make_unique<LinearRegressionModel>(); // Or throw an exception
    }
};

} // namespace core
} // namespace mlops
```