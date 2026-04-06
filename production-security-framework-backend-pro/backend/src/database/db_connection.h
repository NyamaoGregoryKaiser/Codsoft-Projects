#pragma once

#include <pqxx/pqxx>
#include <string>
#include <memory>
#include "../utils/app_config.h"
#include "../utils/logger.h"

namespace Database {

class DBConnection {
public:
    static std::shared_ptr<pqxx::connection> getConnection() {
        std::lock_guard<std::mutex> lock(mtx_);
        if (!conn_ || !conn_->is_open()) {
            LOG_INFO("Establishing new database connection...");
            const auto& config = AppConfig::Config::getInstance();
            std::string conn_str = "host=" + config.db_host +
                                   " port=" + std::to_string(config.db_port) +
                                   " dbname=" + config.db_name +
                                   " user=" + config.db_user +
                                   " password=" + config.db_password;
            try {
                conn_ = std::make_shared<pqxx::connection>(conn_str);
                if (conn_->is_open()) {
                    LOG_INFO("Successfully connected to database: {}", config.db_name);
                } else {
                    LOG_CRITICAL("Failed to connect to database: {}", config.db_name);
                    throw std::runtime_error("Failed to connect to database.");
                }
            } catch (const pqxx::broken_connection& e) {
                LOG_CRITICAL("Database connection broken: {}", e.what());
                conn_.reset(); // Invalidate the broken connection
                throw std::runtime_error("Database connection broken: " + std::string(e.what()));
            } catch (const std::exception& e) {
                LOG_CRITICAL("Error connecting to database: {}", e.what());
                throw std::runtime_error("Database connection error: " + std::string(e.what()));
            }
        }
        return conn_;
    }

    // Call this explicitly during shutdown or when re-initializing
    static void closeConnection() {
        std::lock_guard<std::mutex> lock(mtx_);
        if (conn_ && conn_->is_open()) {
            LOG_INFO("Closing database connection.");
            conn_->disconnect();
            conn_.reset();
        }
    }

private:
    static std::shared_ptr<pqxx::connection> conn_;
    static std::mutex mtx_;

    // Private constructor to prevent instantiation
    DBConnection() = delete;
    DBConnection(const DBConnection&) = delete;
    DBConnection& operator=(const DBConnection&) = delete;
};

// Static members initialization
std::shared_ptr<pqxx::connection> DBConnection::conn_ = nullptr;
std::mutex DBConnection::mtx_;

} // namespace Database