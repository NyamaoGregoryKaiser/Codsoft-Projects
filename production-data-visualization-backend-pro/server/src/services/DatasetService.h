#pragma once

#include <string>
#include <vector>
#include <nlohmann/json.hpp>
#include "models/Dataset.h"

namespace DataVizPro {

class DatasetService {
public:
    DatasetService();

    // Creates a new dataset entry in DB and stores the file
    Dataset createDataset(const std::string& user_id, const std::string& name,
                          const std::string& description, const std::string& file_content,
                          const std::string& file_extension);

    // Retrieves a dataset by ID and user_id
    Dataset getDataset(const std::string& dataset_id, const std::string& user_id);

    // Retrieves all datasets for a given user
    std::vector<Dataset> getAllDatasets(const std::string& user_id);

    // Updates dataset metadata
    Dataset updateDataset(const std::string& dataset_id, const std::string& user_id,
                          const std::string& name, const std::string& description);

    // Deletes a dataset entry and its associated file
    void deleteDataset(const std::string& dataset_id, const std::string& user_id);

    // Retrieves a sample of data from a dataset file
    nlohmann::json getDatasetSampleData(const std::string& dataset_id, const std::string& user_id, int limit = 100);

private:
    std::string generateFilePath(const std::string& user_id, const std::string& filename);
    std::string getDatasetFilePath(const std::string& dataset_id, const std::string& user_id);
};

} // namespace DataVizPro
```