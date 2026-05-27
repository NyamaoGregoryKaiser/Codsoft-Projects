#ifndef ML_UTILITIES_SYSTEM_ML_MODEL_HPP
#define ML_UTILITIES_SYSTEM_ML_MODEL_HPP

#include <string>
#include <chrono>
#include <optional>
#include "nlohmann/json.hpp" // For JSON serialization/deserialization

/**
 * @brief Represents an ML Model entity in the system.
 */
struct MLModel {
    int id = 0;
    std::string name;
    std::string version;
    std::string type;         // e.g., "classification", "regression", "onnx", "pytorch_jit"
    std::string file_path;    // Path to the model file on the server/storage
    std::string description;
    int owner_id = 0;         // ID of the user who registered the model
    std::chrono::system_clock::time_point created_at;
    std::optional<std::string> metadata; // JSON string for additional model-specific metadata

    // Default constructor
    MLModel() = default;

    // Parameterized constructor
    MLModel(int id, const std::string& name, const std::string& version, const std::string& type,
            const std::string& file_path, const std::string& description, int owner_id,
            std::chrono::system_clock::time_point created_at,
            std::optional<std::string> metadata = std::nullopt)
        : id(id), name(name), version(version), type(type), file_path(file_path),
          description(description), owner_id(owner_id), created_at(created_at),
          metadata(std::move(metadata)) {}

    /**
     * @brief Converts an MLModel object to a JSON object.
     * @return A `nlohmann::json` object representing the ML model.
     */
    nlohmann::json toJson() const {
        nlohmann::json j = {
            {"id", id},
            {"name", name},
            {"version", version},
            {"type", type},
            {"filePath", file_path},
            {"description", description},
            {"ownerId", owner_id},
            {"createdAt", std::chrono::duration_cast<std::chrono::seconds>(created_at.time_since_epoch()).count()}
        };
        if (metadata) {
            try {
                j["metadata"] = nlohmann::json::parse(*metadata);
            } catch (const nlohmann::json::parse_error& e) {
                // If metadata is not valid JSON, send it as a string
                j["metadata"] = *metadata;
            }
        } else {
            j["metadata"] = nullptr;
        }
        return j;
    }
};

#endif // ML_UTILITIES_SYSTEM_ML_MODEL_HPP
```