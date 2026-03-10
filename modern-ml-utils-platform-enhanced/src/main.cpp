```cpp
#include <iostream>
#include <memory>
#include <stdexcept>
#include <crow.h>
#include "utils/Config.h"
#include "utils/Logger.h"
#include "database/DatabaseManager.h"
#include "core/PredictionService.h"
#include "api/APIController.h"
#include "api/AuthMiddleware.h"
#include "api/ErrorHandler.h"
#include <filesystem>

int main(int argc, char* argv[]) {
    // 1. Configuration & Setup
    std::string config_filepath = "config/default.json";
    if (argc > 1) {
        config_filepath = argv[1];
    }

    try {
        mlops::utils::Config::getInstance().load(config_filepath);
    } catch (const std::exception& e) {
        std::cerr << "CRITICAL ERROR: Failed to load configuration: " << e.what() << std::endl;
        return 1;
    }

    // 2. Logger Initialization
    mlops::utils::Logger::getInstance().init(
        mlops::utils::Config::getInstance().getLogFilePath(),
        mlops::utils::Config::getInstance().getLogLevel() == "DEBUG" ? mlops::LogLevel::DEBUG :
        mlops::utils::Config::getInstance().getLogLevel() == "INFO" ? mlops::LogLevel::INFO :
        mlops::utils::Config::getInstance().getLogLevel() == "WARN" ? mlops::LogLevel::WARN :
        mlops::LogLevel::ERROR
    );
    LOG_INFO("MLOps Core Service Starting...");

    try {
        // Ensure model storage directory exists
        std::string model_storage_path = mlops::utils::Config::getInstance().getModelStoragePath();
        if (!std::filesystem::exists(model_storage_path)) {
            std::filesystem::create_directories(model_storage_path);
            LOG_INFO("Created model storage directory: " + model_storage_path);
        }

        // 3. Database Layer Initialization
        auto db_manager = std::make_shared<mlops::database::DatabaseManager>(
            mlops::utils::Config::getInstance().getDbPath()
        );

        // 4. Core Application Services Initialization
        auto prediction_service = std::make_shared<mlops::core::PredictionService>(
            db_manager,
            100 // Cache capacity for model versions
        );

        // 5. API Endpoints Setup
        crow::App<mlops::api::AuthMiddleware, mlops::api::ErrorHandler> app;
        mlops::api::APIController api_controller(app, db_manager, prediction_service);

        // Global error handler for unhandled exceptions within Crow routes
        app.set_exception_handler([](const crow::request& req, crow::response& res, std::exception_ptr ep) {
            try {
                std::rethrow_exception(ep);
            } catch (const mlops::api::ApiException& e) {
                res = e.toCrowResponse();
            } catch (const std::exception& e) {
                res = mlops::api::ErrorHandler::handleException(e);
            } catch (...) {
                res = mlops::api::ErrorHandler::handleException(std::runtime_error("Unknown exception occurred."));
            }
            res.end();
        });


        // 6. Start Server
        int port = mlops::utils::Config::getInstance().getPort();
        int worker_threads = mlops::utils::Config::getInstance().getWorkerThreads();
        LOG_INFO("Starting server on port: " + std::to_string(port) + " with " + std::to_string(worker_threads) + " worker threads.");
        app.port(port).multithreaded().run();

        LOG_INFO("MLOps Core Service Shutting down.");
    } catch (const std::exception& e) {
        LOG_ERROR("CRITICAL RUNTIME ERROR: " + std::string(e.what()));
        return 1;
    } catch (...) {
        LOG_ERROR("CRITICAL UNKNOWN RUNTIME ERROR occurred.");
        return 1;
    }

    return 0;
}
```