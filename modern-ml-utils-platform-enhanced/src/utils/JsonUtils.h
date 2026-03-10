```cpp
#pragma once

#include <nlohmann/json.hpp>
#include "Types.h"
#include <stdexcept>
#include <iostream>

namespace mlops {
namespace utils {

// Convert ModelParameters to JSON
inline nlohmann::json modelParametersToJson(const ModelParameters& params) {
    nlohmann::json j;
    for (const auto& pair : params) {
        j[pair.first] = pair.second;
    }
    return j;
}

// Convert JSON to ModelParameters
inline ModelParameters jsonToModelParameters(const nlohmann::json& j) {
    ModelParameters params;
    if (j.is_object()) {
        for (nlohmann::json::const_iterator it = j.begin(); it != j.end(); ++it) {
            if (it.value().is_number()) {
                params[it.key()] = it.value().get<double>();
            } else {
                // Log or handle non-numeric parameters if necessary
                std::cerr << "Warning: Non-numeric parameter '" << it.key() << "' in model parameters JSON." << std::endl;
            }
        }
    }
    return params;
}

// Convert PredictionInput to JSON
inline nlohmann::json predictionInputToJson(const PredictionInput& input) {
    nlohmann::json j;
    for (const auto& pair : input) {
        j[pair.first] = pair.second;
    }
    return j;
}

// Convert JSON to PredictionInput
inline PredictionInput jsonToPredictionInput(const nlohmann::json& j) {
    PredictionInput input;
    if (j.is_object()) {
        for (nlohmann::json::const_iterator it = j.begin(); it != j.end(); ++it) {
            if (it.value().is_number()) {
                input[it.key()] = it.value().get<double>();
            } else {
                std::cerr << "Warning: Non-numeric input feature '" << it.key() << "' in prediction input JSON." << std::endl;
            }
        }
    }
    return input;
}

// Convert PredictionOutput to JSON
inline nlohmann::json predictionOutputToJson(const PredictionOutput& output) {
    nlohmann::json j;
    for (const auto& pair : output) {
        j[pair.first] = pair.second;
    }
    return j;
}

// Convert JSON to PredictionOutput
inline PredictionOutput jsonToPredictionOutput(const nlohmann::json& j) {
    PredictionOutput output;
    if (j.is_object()) {
        for (nlohmann::json::const_iterator it = j.begin(); it != j.end(); ++it) {
            if (it.value().is_number()) {
                output[it.key()] = it.value().get<double>();
            } else {
                std::cerr << "Warning: Non-numeric output value '" << it.key() << "' in prediction output JSON." << std::endl;
            }
        }
    }
    return output;
}

// Convert ModelDTO to JSON
inline nlohmann::json modelDtoToJson(const ModelDTO& dto) {
    nlohmann::json j;
    if (dto.id) j["id"] = *dto.id;
    j["name"] = dto.name;
    j["description"] = dto.description;
    j["created_at"] = dto.created_at;
    j["updated_at"] = dto.updated_at;
    return j;
}

// Convert JSON to ModelDTO
inline ModelDTO jsonToModelDto(const nlohmann::json& j) {
    ModelDTO dto;
    if (j.count("id") && !j["id"].is_null()) dto.id = j["id"].get<int>();
    dto.name = j.at("name").get<std::string>();
    dto.description = j.at("description").get<std::string>();
    dto.created_at = j.count("created_at") ? j.at("created_at").get<std::string>() : "";
    dto.updated_at = j.count("updated_at") ? j.at("updated_at").get<std::string>() : "";
    return dto;
}

// Convert ModelVersionDTO to JSON
inline nlohmann::json modelVersionDtoToJson(const ModelVersionDTO& dto) {
    nlohmann::json j;
    if (dto.id) j["id"] = *dto.id;
    j["model_id"] = dto.model_id;
    j["version_tag"] = dto.version_tag;
    j["model_path"] = dto.model_path;
    j["created_at"] = dto.created_at;
    j["is_active"] = dto.is_active;
    j["parameters"] = modelParametersToJson(dto.parameters);
    j["notes"] = dto.notes;
    return j;
}

// Convert JSON to ModelVersionDTO
inline ModelVersionDTO jsonToModelVersionDto(const nlohmann::json& j) {
    ModelVersionDTO dto;
    if (j.count("id") && !j["id"].is_null()) dto.id = j["id"].get<int>();
    dto.model_id = j.at("model_id").get<int>();
    dto.version_tag = j.at("version_tag").get<std::string>();
    dto.model_path = j.at("model_path").get<std::string>();
    dto.created_at = j.count("created_at") ? j.at("created_at").get<std::string>() : "";
    dto.is_active = j.at("is_active").get<bool>();
    dto.parameters = jsonToModelParameters(j.at("parameters"));
    dto.notes = j.at("notes").get<std::string>();
    return dto;
}

// Convert PredictionLogDTO to JSON
inline nlohmann::json predictionLogDtoToJson(const PredictionLogDTO& dto) {
    nlohmann::json j;
    if (dto.id) j["id"] = *dto.id;
    j["model_version_id"] = dto.model_version_id;
    j["input_data"] = predictionInputToJson(dto.input_data);
    j["output_data"] = predictionOutputToJson(dto.output_data);
    j["timestamp"] = dto.timestamp;
    j["status"] = dto.status;
    j["error_message"] = dto.error_message;
    return j;
}

// Convert JSON to PredictionLogDTO
inline PredictionLogDTO jsonToPredictionLogDto(const nlohmann::json& j) {
    PredictionLogDTO dto;
    if (j.count("id") && !j["id"].is_null()) dto.id = j["id"].get<int>();
    dto.model_version_id = j.at("model_version_id").get<int>();
    dto.input_data = jsonToPredictionInput(j.at("input_data"));
    dto.output_data = jsonToPredictionOutput(j.at("output_data"));
    dto.timestamp = j.at("timestamp").get<std::string>();
    dto.status = j.at("status").get<std::string>();
    dto.error_message = j.at("error_message").get<std::string>();
    return dto;
}

} // namespace utils
} // namespace mlops
```