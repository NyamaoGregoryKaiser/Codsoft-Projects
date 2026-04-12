```cpp
#ifndef APP_H
#define APP_H

#include <string>
#include <memory>
#include <stdexcept>
#include <csignal>
#include "utils/Logger.h"
#include "config/ConfigManager.h"
#include "database/DatabaseManager.h"
#include "api/ApiServer.h"
#include "scraping/JobScheduler.h"

namespace Scraper {

class App {
public:
    App() = default;
    ~App() {
        shutdown();
    }

    void init() {
        Scraper::Utils::Logger::init("scraper_app", "logs/scraper_app.log");
        auto logger = Scraper::Utils::Logger::get_logger();
        logger->info("Application initializing...");

        // Load configuration
        try {
            config_manager_ = &Scraper::Config::ConfigManager::getInstance();
            config_manager_->loadConfig("config/.env");
        } catch (const std::runtime_error& e) {
            logger->critical("Configuration error: {}", e.what());
            throw;
        }

        // Initialize Database Manager
        try {
            database_manager_ = &Scraper::Database::DatabaseManager::getInstance();
            std::string db_conn_str = config_manager_->getString("DATABASE_URL");
            size_t db_pool_size = static_cast<size_t>(config_manager_->getInt("DATABASE_POOL_SIZE", 5));
            if (db_conn_str.empty()) {
                logger->critical("DATABASE_URL not set in configuration.");
                throw std::runtime_error("DATABASE_URL is required.");
            }
            database_manager_->initialize(db_conn_str, db_pool_size);
        } catch (const Scraper::Utils::DatabaseException& e) {
            logger->critical("Database initialization failed: {}", e.what());
            throw;
        } catch (const std::exception& e) {
            logger->critical("General error during database initialization: {}", e.what());
            throw;
        }

        // Initialize API Server
        std::string api_host = config_manager_->getString("API_HOST", "0.0.0.0");
        int api_port = config_manager_->getInt("API_PORT", 9080);
        Pistache::Port port(api_port);
        Pistache::Address addr(api_host, port);
        api_server_ = std::make_unique<Scraper::API::ApiServer>(addr);
        api_server_->init(static_cast<size_t>(config_manager_->getInt("API_THREADS", 2)));

        // Initialize Job Scheduler
        job_scheduler_ = &Scraper::Scraping::JobScheduler::getInstance();
        
        logger->info("Application initialization complete.");
    }

    void run() {
        auto logger = Scraper::Utils::Logger::get_logger();
        logger->info("Starting application services...");

        // Start Job Scheduler
        job_scheduler_->start();

        // Start API Server
        api_server_->start();
        
        // Block main thread or keep alive for graceful shutdown
        // In this detached thread scenario, the main thread can exit or join
        // a shutdown event. For a server, you'd typically wait on a condition variable
        // or a signal.
        logger->info("Application services started. Press Ctrl+C to stop.");
        
        // This is a simple blocking mechanism to keep the main thread alive.
        // A more robust solution would involve signal handling.
        std::unique_lock<std::mutex> lk(mtx_);
        cv_app_shutdown_.wait(lk, [this]{ return shutdown_requested_.load(); });
        
        logger->info("Shutdown requested. Exiting main run loop.");
    }

    void shutdown() {
        if (!shutdown_requested_.exchange(true)) { // Only execute shutdown once
            auto logger = Scraper::Utils::Logger::get_logger();
            logger->info("Application shutting down...");

            if (api_server_) {
                api_server_->shutdown();
            }
            if (job_scheduler_) {
                job_scheduler_->shutdown();
            }
            // Database connections will be released when ConnectionPool is destroyed.
            logger->info("Application shutdown complete.");
            cv_app_shutdown_.notify_all(); // Notify main thread if it's waiting
        }
    }

    void handleSignal(int signal) {
        auto logger = Scraper::Utils::Logger::get_logger();
        logger->warn("Received signal {}, initiating graceful shutdown...", signal);
        shutdown();
    }

private:
    Scraper::Config::ConfigManager* config_manager_ = nullptr; // Singleton
    Scraper::Database::DatabaseManager* database_manager_ = nullptr; // Singleton
    std::unique_ptr<Scraper::API::ApiServer> api_server_;
    Scraper::Scraping::JobScheduler* job_scheduler_ = nullptr; // Singleton

    std::mutex mtx_;
    std::condition_variable cv_app_shutdown_;
    std::atomic<bool> shutdown_requested_ = false;
};

} // namespace Scraper

#endif // APP_H
```