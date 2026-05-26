#pragma once

#include <string>
#include <vector>
#include <nlohmann/json.hpp>

namespace DataVizPro {
namespace DataProcessingService {

// Simulates parsing a CSV file and inferring a basic schema
nlohmann::json parseAndInferSchema(const std::string& file_path, int& row_count);

// Simulates reading a subset of data from a file
nlohmann::json readDataSample(const std::string& file_path, int limit = 100);

// In a real system, this would involve more sophisticated data types, error handling,
// and potentially streaming for very large files.
nlohmann::json parseAndInferSchema(const std::string& file_path, int& row_count) {
    nlohmann::json schema_json;
    std::ifstream file(file_path);
    std::string line;
    row_count = 0;

    if (!file.is_open()) {
        LOG_ERROR("Failed to open file for schema inference: {}", file_path);
        throw DataVizError(ErrorCode::SERVICE_UNAVAILABLE, "Could not open dataset file", file_path, 500);
    }

    if (std::getline(file, line)) { // Read header
        std::stringstream ss(line);
        std::string cell;
        std::vector<std::string> headers;
        while (std::getline(ss, cell, ',')) { // Simple CSV split
            headers.push_back(cell);
        }
        
        schema_json["columns"] = nlohmann::json::array();
        for (const auto& h : headers) {
            // Very basic type inference: assume all strings for now.
            // In a real app, you'd read a few rows to guess int/float/date/string.
            schema_json["columns"].push_back({{"name", h}, {"type", "string"}});
        }
    }

    while (std::getline(file, line)) {
        row_count++;
    }
    
    return schema_json;
}

nlohmann::json readDataSample(const std::string& file_path, int limit) {
    nlohmann::json data_array = nlohmann::json::array();
    std::ifstream file(file_path);
    std::string line;
    int current_row = 0;

    if (!file.is_open()) {
        LOG_ERROR("Failed to open file for data sample: {}", file_path);
        return data_array;
    }

    std::vector<std::string> headers;
    if (std::getline(file, line)) { // Read header
        std::stringstream ss(line);
        std::string cell;
        while (std::getline(ss, cell, ',')) {
            headers.push_back(cell);
        }
    }

    while (std::getline(file, line) && current_row < limit) {
        std::stringstream ss(line);
        std::string cell;
        nlohmann::json row_obj;
        int col_idx = 0;
        while (std::getline(ss, cell, ',') && col_idx < headers.size()) {
            row_obj[headers[col_idx]] = cell; // All values as strings for simplicity
            col_idx++;
        }
        data_array.push_back(row_obj);
        current_row++;
    }

    return data_array;
}

} // namespace DataProcessingService
} // namespace DataVizPro
```