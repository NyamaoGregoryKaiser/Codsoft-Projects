#ifndef ML_UTILITIES_SYSTEM_DATA_POINT_HPP
#define ML_UTILITIES_SYSTEM_DATA_POINT_HPP

#include <string>
#include <chrono>
#include <optional>
#include "nlohmann/json.hpp"

/**
 * @brief Represents a DataPoint entity for ML inference requests/results.
 *
 * This struct is used to encapsulate input data for inference and the
 * resulting prediction, along with metadata.
 */
struct DataPoint {
    int id = 0;
    int model_id = 0;
    int user_id = 0;
    std::string input_data;   // JSON string representing the input features
    std::optional<std::string> prediction; // JSON string representing the prediction result
    std::chrono::system_clock::time_point created_at;

    // Default constructor
    DataPoint() = default;

    // Parameterized constructor
    DataPoint(int id, int model_id, int user_id, const std::string& input_data,
              std::optional<std::string> prediction,
              std::chrono::system_clock::time_point created_at)
        : id(id), model_id(model_id), user_id(user_id), input_data(input_data),
          prediction(std::move(prediction)), created_at(created_at) {}

    /**
     * @brief Converts a DataPoint object to a JSON object.
     * @return A `nlohmann::json` object representing the data point.
     */
    nlohmann::json toJson() const {
        nlohmann::json j = {
            {"id", id},
            {"modelId", model_id},
            {"userId", user_id},
            {"createdAt", std::chrono::duration_cast<std::chrono::seconds>(created_at.time_since_epoch()).count()}
        };
        try {
            j["inputData"] = nlohmann::json::parse(input_data);
        } catch (const nlohmann::json::parse_error& e) {
            j["inputData"] = input_data; // Fallback to string if not valid JSON
        }
        if (prediction) {
            try {
                j["prediction"] = nlohmann::json::parse(*prediction);
            } catch (const nlohmann::json::parse_error& e) {
                j["prediction"] = *prediction; // Fallback to string
            }
        } else {
            j["prediction"] = nullptr;
        }
        return j;
    }
};

#endif // ML_UTILITIES_SYSTEM_DATA_POINT_HPP
```