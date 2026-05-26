#include "DatasetService.h"
#include "db/DBManager.h"
#include "db/SQLQueries.h"
#include "common/Error.h"
#include "utils/Logger.h"
#include "DataProcessingService.h" // For schema inference and data reading

#include <fstream>
#include <filesystem> // C++17 filesystem
#include <boost/uuid/uuid.hpp>            // for uuid
#include <boost/uuid/uuid_generators.hpp> // for uuid generators
#include <boost/uuid/uuid_io.hpp>         // for uuid to string conversion

namespace DataVizPro {

namespace fs = std::filesystem;

// Configuration for data storage
const std::string DATA_STORAGE_BASE_PATH = "data_storage";

DatasetService::DatasetService() {
    // Ensure the data storage directory exists
    if (!fs::exists(DATA_STORAGE_BASE_PATH)) {
        fs::create_directories(DATA_STORAGE_BASE_PATH);
        LOG_INFO("Created data storage directory: {}", DATA_STORAGE_BASE_PATH);
    }
}

std::string DatasetService::generateFilePath(const std::string& user_id, const std::string& filename) {
    // Create a user-specific subdirectory
    fs::path user_dir = fs::path(DATA_STORAGE_BASE_PATH) / user_id;
    if (!fs::exists(user_dir)) {
        fs::create_directories(user_dir);
    }

    // Generate a unique filename to prevent collisions, preserving original extension
    boost::uuids::uuid uuid = boost::uuids::random_generator()();
    std::string unique_filename = boost::uuids::to_string(uuid) + "_" + filename;
    return (user_dir / unique_filename).string();
}

Dataset DatasetService::createDataset(const std::string& user_id, const std::string& name,
                                      const std::string& description, const std::string& file_content,
                                      const std::string& file_extension) {
    // 1. Store the file
    std::string filename_with_ext = name + "." + file_extension; // Using name as base for now
    std::string file_path = generateFilePath(user_id, filename_with_ext);

    std::ofstream outfile(file_path);
    if (!outfile.is_open()) {
        LOG_ERROR("Failed to write dataset file to: {}", file_path);
        throw DataVizError(ErrorCode::SERVICE_UNAVAILABLE, "Failed to save dataset file", "", 500);
    }
    outfile << file_content;
    outfile.close();
    LOG_INFO("Dataset file saved to: {}", file_path);

    // 2. Infer schema and row count
    nlohmann::json inferred_schema;
    int row_count = 0;
    try {
        inferred_schema = DataProcessingService::parseAndInferSchema(file_path, row_count);
    } catch (const DataVizError& e) {
        fs::remove(file_path); // Clean up file if schema inference fails
        throw;
    } catch (const std::exception& e) {
        fs::remove(file_path); // Clean up file
        throw DataVizError(ErrorCode::SERVICE_UNAVAILABLE, "Failed to process dataset file (schema inference)", e.what(), 500);
    }


    // 3. Save metadata to DB
    auto conn = DBManager::getInstance().getConnection();
    pqxx::work txn(*conn);

    try {
        pqxx::result r = txn.exec_params(
            SQLQueries::INSERT_DATASET,
            pqxx::uuid_string(user_id),
            name,
            description,
            file_path,
            inferred_schema.dump(), // Store JSONB as string
            row_count
        );
        txn.commit();

        if (r.empty()) {
            throw DataVizError(ErrorCode::DB_ERROR, "Failed to create dataset: no ID returned", "", 500);
        }

        Dataset new_dataset;
        new_dataset.id = r[0][0].as<std::string>();
        new_dataset.user_id = user_id;
        new_dataset.name = name;
        new_dataset.description = description;
        new_dataset.file_path = file_path;
        new_dataset.data_schema = inferred_schema;
        new_dataset.row_count = row_count;
        new_dataset.uploaded_at = std::chrono::system_clock::now(); // Set by DB, but for immediate use

        LOG_INFO("Dataset '{}' (ID: {}) created by user {}", name, new_dataset.id, user_id);
        return new_dataset;

    } catch (const pqxx::unique_violation& e) {
        txn.abort();
        fs::remove(file_path); // Clean up file
        throw DataVizError(ErrorCode::DUPLICATE_ENTRY, "Dataset with this name already exists for this user.", e.what(), 409);
    } catch (const pqxx::sql_error& e) {
        txn.abort();
        fs::remove(file_path); // Clean up file
        LOG_ERROR("Database error during dataset creation: {}", e.what());
        throw DataVizError(ErrorCode::DB_ERROR, "Failed to create dataset", e.what(), 500);
    } catch (const DataVizError& e) {
        txn.abort();
        fs::remove(file_path); // Clean up file
        throw;
    } catch (const std::exception& e) {
        txn.abort();
        fs::remove(file_path); // Clean up file
        LOG_ERROR("Unexpected error during dataset creation: {}", e.what());
        throw DataVizError(ErrorCode::UNKNOWN_ERROR, "Failed to create dataset", e.what(), 500);
    }
}

Dataset DatasetService::getDataset(const std::string& dataset_id, const std::string& user_id) {
    auto conn = DBManager::getInstance().getConnection();
    pqxx::nontransaction N(*conn);

    pqxx::result r = N.exec_params(SQLQueries::SELECT_DATASET_BY_ID_AND_USER, pqxx::uuid_string(dataset_id), pqxx::uuid_string(user_id));

    if (r.empty()) {
        throw DataVizError(ErrorCode::NOT_FOUND, "Dataset not found or unauthorized access", "", 404);
    }

    Dataset dataset;
    dataset.id = r[0]["id"].as<std::string>();
    dataset.user_id = r[0]["user_id"].as<std::string>();
    dataset.name = r[0]["name"].as<std::string>();
    dataset.description = r[0]["description"].as<std::string>();
    dataset.file_path = r[0]["file_path"].as<std::string>();
    dataset.data_schema = nlohmann::json::parse(r[0]["data_schema"].as<std::string>());
    dataset.row_count = r[0]["row_count"].as<int>();
    dataset.uploaded_at = r[0]["uploaded_at"].as<std::chrono::system_clock::time_point>();

    return dataset;
}

std::vector<Dataset> DatasetService::getAllDatasets(const std::string& user_id) {
    auto conn = DBManager::getInstance().getConnection();
    pqxx::nontransaction N(*conn);

    pqxx::result r = N.exec_params(SQLQueries::SELECT_ALL_DATASETS_BY_USER, pqxx::uuid_string(user_id));

    std::vector<Dataset> datasets;
    for (const auto& row : r) {
        Dataset dataset;
        dataset.id = row["id"].as<std::string>();
        dataset.user_id = row["user_id"].as<std::string>();
        dataset.name = row["name"].as<std::string>();
        dataset.description = row["description"].as<std::string>();
        dataset.row_count = row["row_count"].as<int>();
        dataset.uploaded_at = row["uploaded_at"].as<std::chrono::system_clock::time_point>();
        // file_path and data_schema are not retrieved in this summary query
        datasets.push_back(dataset);
    }
    return datasets;
}

Dataset DatasetService::updateDataset(const std::string& dataset_id, const std::string& user_id,
                                      const std::string& name, const std::string& description) {
    auto conn = DBManager::getInstance().getConnection();
    pqxx::work txn(*conn);

    // Fetch existing dataset to get current schema and row_count, if they weren't updated
    Dataset existing_dataset = getDataset(dataset_id, user_id); // This will throw if not found/unauthorized

    pqxx::result r = txn.exec_params(
        SQLQueries::UPDATE_DATASET,
        name,
        description,
        existing_dataset.data_schema.dump(), // Keep original schema unless explicit update via API
        existing_dataset.row_count,          // Keep original row_count unless explicit update
        pqxx::uuid_string(dataset_id),
        pqxx::uuid_string(user_id)
    );
    txn.commit();

    if (r.empty()) {
        throw DataVizError(ErrorCode::NOT_FOUND, "Dataset not found or unauthorized to update", "", 404);
    }

    LOG_INFO("Dataset '{}' (ID: {}) updated by user {}.", name, dataset_id, user_id);
    existing_dataset.name = name;
    existing_dataset.description = description;
    existing_dataset.updated_at = std::chrono::system_clock::now();
    return existing_dataset; // Return updated dataset object
}

void DatasetService::deleteDataset(const std::string& dataset_id, const std::string& user_id) {
    // First, retrieve the dataset to get the file path
    Dataset dataset_to_delete = getDataset(dataset_id, user_id); // This will throw if not found/unauthorized

    auto conn = DBManager::getInstance().getConnection();
    pqxx::work txn(*conn);

    pqxx::result r = txn.exec_params(SQLQueries::DELETE_DATASET, pqxx::uuid_string(dataset_id), pqxx::uuid_string(user_id));
    txn.commit();

    if (r.empty()) {
        throw DataVizError(ErrorCode::NOT_FOUND, "Dataset not found or unauthorized to delete", "", 404);
    }

    // Attempt to delete the associated file
    try {
        fs::remove(dataset_to_delete.file_path);
        LOG_INFO("Deleted dataset file: {}", dataset_to_delete.file_path);
    } catch (const fs::filesystem_error& e) {
        LOG_ERROR("Failed to delete dataset file {}: {}", dataset_to_delete.file_path, e.what());
        // We log the error but don't re-throw as the DB record is already gone.
        // In a more robust system, this might trigger a cleanup task or alert.
    }

    LOG_INFO("Dataset ID {} deleted by user {}.", dataset_id, user_id);
}

nlohmann::json DatasetService::getDatasetSampleData(const std::string& dataset_id, const std::string& user_id, int limit) {
    Dataset dataset = getDataset(dataset_id, user_id); // Ensures user owns dataset
    
    return DataProcessingService::readDataSample(dataset.file_path, limit);
}

} // namespace DataVizPro
```