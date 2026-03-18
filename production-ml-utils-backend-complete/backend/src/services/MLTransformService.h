#pragma once

#include "models/MLTransformConfig.h"
#include <vector>
#include <string>

class MLTransformService {
public:
    MLTransformService() = default;

    TransformData applyStandardScaler(const TransformData& input_data);
    TransformData applyMinMaxScaler(const TransformData& input_data);

    // Mock prediction function
    nlohmann::json mockPrediction(const std::string& model_id, const nlohmann::json& input_features);
};
```