#include "MLTransformConfig.h"
#include "common/ErrorHandling.h"

nlohmann::json TransformData::toJson() const {
    nlohmann::json j;
    j["features"] = features;
    j["feature_names"] = feature_names;
    return j;
}

TransformData TransformData::fromJson(const nlohmann::json& json) {
    TransformData data;
    if (!json.contains("features") || !json["features"].is_array()) {
        throw BadRequestError("Missing or invalid 'features' array in transformation request.");
    }
    data.features = json.at("features").get<std::vector<std::vector<double>>>();

    if (json.contains("feature_names") && json["feature_names"].is_array()) {
        data.feature_names = json.at("feature_names").get<std::vector<std::string>>();
        // Basic validation: ensure feature names count matches feature count if provided
        if (!data.features.empty() && !data.feature_names.empty() && data.feature_names.size() != data.features[0].size()) {
            throw BadRequestError("Number of 'feature_names' does not match the number of features (columns).");
        }
    }
    return data;
}
```