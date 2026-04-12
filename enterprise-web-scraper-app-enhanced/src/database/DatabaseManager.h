```cpp
#ifndef DATABASE_MANAGER_H
#define DATABASE_MANAGER_H

#include <string>
#include <vector>
#include <pqxx/pqxx>
#include <nlohmann/json.hpp>
#include <chrono>
#include <uuid/uuid.h>
#include "../utils/Logger.h"
#include "../utils/ErrorHandler.h"
#include "models/User.h"
#include "models/ScrapingJob.h"
#include "models/ScrapedData.h"
#include "ConnectionPool.h"

namespace Scraper {
namespace Database {

using namespace Models;

class DatabaseManager {
public:
    static DatabaseManager& getInstance() {
        static DatabaseManager instance;
        return instance;
    }

    void initialize(const std::string& connection_string, size_t pool_size) {
        Scraper::Database::ConnectionPool::getInstance().init(connection_string, pool_size);
        Scraper::Utils::Logger::get_logger()->info("DatabaseManager initialized.");
    }

    // --- Utility Functions ---
    std::string generateUuid() const {
        uuid_t uuid;
        uuid_generate_random(uuid);
        char uuid_str[37];
        uuid_unparse_lower(uuid, uuid_str);
        return std::string(uuid_str);
    }

    // Time point conversion to string (ISO 8601 format)
    std::string toIsoString(const std::chrono::system_clock::time_point& tp) const {
        std::time_t tt = std::chrono::system_clock::to_time_t(tp);
        std::tm tm = *std::gmtime(&tt); // Use gmtime for UTC
        std::ostringstream oss;
        oss << std::put_time(&tm, "%Y-%m-%d %H:%M:%S");
        return oss.str();
    }

    // String (ISO 8601) to time point conversion
    std::chrono::system_clock::time_point fromIsoString(const std::string& str) const {
        std::tm tm{};
        std::istringstream iss(str);
        iss >> std::get_time(&tm, "%Y-%m-%d %H:%M:%S");
        if (iss.fail()) {
            throw std::runtime_error("Failed to parse time string: " + str);
        }
        // mktime expects local time, but we store UTC. Adjust accordingly or use specialized libs.
        // For simplicity, we assume the string is UTC and treat mktime's output as UTC.
        // For real-world use, use a robust date/time library (e.g., C++20 chrono or Boost.DateTime).
        return std::chrono::system_clock::from_time_t(timegm(&tm)); // timegm is GNU specific, use custom for portability
    }
    // Note: for timegm portability, one would write a custom function for std::mktime with timezone adjustment.
    // For this demo, assuming timegm is available or build system handles it.

    // --- User CRUD ---
    std::optional<User> createUser(const User& user) {
        auto conn_wrapper = Scraper::Database::ConnectionPool::getInstance().getConnection();
        pqxx::connection& conn = *conn_wrapper;
        try {
            pqxx::work txn(conn);
            std::string query = R"(
                INSERT INTO users (id, username, email, password_hash, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;
            )";
            pqxx::result r = txn.exec_params(query, user.id, user.username, user.email, user.password_hash,
                                            toIsoString(user.created_at), toIsoString(user.updated_at));
            txn.commit();
            if (r.empty()) return std::nullopt;
            Scraper::Utils::Logger::get_logger()->info("User created: {}", user.username);
            return getUserById(r[0][0].as<std::string>());
        } catch (const pqxx::sql_error& e) {
            Scraper::Utils::Logger::get_logger()->error("DB error creating user: {}", e.what());
            throw Scraper::Utils::DatabaseException("Failed to create user: " + std::string(e.what()));
        }
        catch (const std::exception& e) {
            Scraper::Utils::Logger::get_logger()->error("Error creating user: {}", e.what());
            throw Scraper::Utils::DatabaseException("Failed to create user: " + std::string(e.what()));
        } finally {
            Scraper::Database::ConnectionPool::getInstance().releaseConnection(std::move(conn_wrapper));
        }
    }

    std::optional<User> getUserByUsername(const std::string& username) {
        auto conn_wrapper = Scraper::Database::ConnectionPool::getInstance().getConnection();
        pqxx::connection& conn = *conn_wrapper;
        try {
            pqxx::nontransaction w(conn);
            pqxx::result r = w.exec_params("SELECT id, username, email, password_hash, created_at, updated_at FROM users WHERE username = $1", username);
            if (r.empty()) return std::nullopt;

            User user;
            user.id = r[0]["id"].as<std::string>();
            user.username = r[0]["username"].as<std::string>();
            user.email = r[0]["email"].as<std::string>();
            user.password_hash = r[0]["password_hash"].as<std::string>();
            user.created_at = fromIsoString(r[0]["created_at"].as<std::string>());
            user.updated_at = fromIsoString(r[0]["updated_at"].as<std::string>());
            return user;
        } catch (const pqxx::sql_error& e) {
            Scraper::Utils::Logger::get_logger()->error("DB error getting user by username: {}", e.what());
            throw Scraper::Utils::DatabaseException("Failed to get user by username: " + std::string(e.what()));
        }
        catch (const std::exception& e) {
            Scraper::Utils::Logger::get_logger()->error("Error getting user by username: {}", e.what());
            throw Scraper::Utils::DatabaseException("Failed to get user by username: " + std::string(e.what()));
        } finally {
            Scraper::Database::ConnectionPool::getInstance().releaseConnection(std::move(conn_wrapper));
        }
    }

    std::optional<User> getUserById(const std::string& id) {
        auto conn_wrapper = Scraper::Database::ConnectionPool::getInstance().getConnection();
        pqxx::connection& conn = *conn_wrapper;
        try {
            pqxx::nontransaction w(conn);
            pqxx::result r = w.exec_params("SELECT id, username, email, password_hash, created_at, updated_at FROM users WHERE id = $1", id);
            if (r.empty()) return std::nullopt;

            User user;
            user.id = r[0]["id"].as<std::string>();
            user.username = r[0]["username"].as<std::string>();
            user.email = r[0]["email"].as<std::string>();
            user.password_hash = r[0]["password_hash"].as<std::string>();
            user.created_at = fromIsoString(r[0]["created_at"].as<std::string>());
            user.updated_at = fromIsoString(r[0]["updated_at"].as<std::string>());
            return user;
        } catch (const pqxx::sql_error& e) {
            Scraper::Utils::Logger::get_logger()->error("DB error getting user by ID: {}", e.what());
            throw Scraper::Utils::DatabaseException("Failed to get user by ID: " + std::string(e.what()));
        }
        catch (const std::exception& e) {
            Scraper::Utils::Logger::get_logger()->error("Error getting user by ID: {}", e.what());
            throw Scraper::Utils::DatabaseException("Failed to get user by ID: " + std::string(e.what()));
        } finally {
            Scraper::Database::ConnectionPool::getInstance().releaseConnection(std::move(conn_wrapper));
        }
    }

    // --- ScrapingJob CRUD ---
    std::optional<ScrapingJob> createJob(const ScrapingJob& job) {
        auto conn_wrapper = Scraper::Database::ConnectionPool::getInstance().getConnection();
        pqxx::connection& conn = *conn_wrapper;
        try {
            pqxx::work txn(conn);
            std::string query = R"(
                INSERT INTO scraping_jobs (id, user_id, name, target_url, cron_schedule, css_selector, status, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id;
            )";
            pqxx::result r = txn.exec_params(query, job.id, job.user_id, job.name, job.target_url,
                                            job.cron_schedule, job.css_selector, jobStatusToString(job.status),
                                            toIsoString(job.created_at), toIsoString(job.updated_at));
            txn.commit();
            if (r.empty()) return std::nullopt;
            Scraper::Utils::Logger::get_logger()->info("Scraping job created: {}", job.name);
            return getJobById(r[0][0].as<std::string>());
        } catch (const pqxx::sql_error& e) {
            Scraper::Utils::Logger::get_logger()->error("DB error creating job: {}", e.what());
            throw Scraper::Utils::DatabaseException("Failed to create job: " + std::string(e.what()));
        }
        catch (const std::exception& e) {
            Scraper::Utils::Logger::get_logger()->error("Error creating job: {}", e.what());
            throw Scraper::Utils::DatabaseException("Failed to create job: " + std::string(e.what()));
        } finally {
            Scraper::Database::ConnectionPool::getInstance().releaseConnection(std::move(conn_wrapper));
        }
    }

    std::vector<ScrapingJob> getAllJobs(const std::string& user_id = "") {
        auto conn_wrapper = Scraper::Database::ConnectionPool::getInstance().getConnection();
        pqxx::connection& conn = *conn_wrapper;
        std::vector<ScrapingJob> jobs;
        try {
            pqxx::nontransaction w(conn);
            pqxx::result r;
            if (user_id.empty()) {
                 r = w.exec("SELECT id, user_id, name, target_url, cron_schedule, css_selector, status, last_run_message, last_run_at, created_at, updated_at FROM scraping_jobs");
            } else {
                 r = w.exec_params("SELECT id, user_id, name, target_url, cron_schedule, css_selector, status, last_run_message, last_run_at, created_at, updated_at FROM scraping_jobs WHERE user_id = $1", user_id);
            }

            for (const auto& row : r) {
                ScrapingJob job;
                job.id = row["id"].as<std::string>();
                job.user_id = row["user_id"].as<std::string>();
                job.name = row["name"].as<std::string>();
                job.target_url = row["target_url"].as<std::string>();
                job.cron_schedule = row["cron_schedule"].as<std::string>();
                job.css_selector = row["css_selector"].as<std::string>();
                job.status = stringToJobStatus(row["status"].as<std::string>());
                
                if (row["last_run_message"].is_null()) {
                    job.last_run_message = std::nullopt;
                } else {
                    job.last_run_message = row["last_run_message"].as<std::string>();
                }
                if (row["last_run_at"].is_null()) {
                    job.last_run_at = std::nullopt;
                } else {
                    job.last_run_at = fromIsoString(row["last_run_at"].as<std::string>());
                }
                job.created_at = fromIsoString(row["created_at"].as<std::string>());
                job.updated_at = fromIsoString(row["updated_at"].as<std::string>());
                jobs.push_back(job);
            }
            return jobs;
        } catch (const pqxx::sql_error& e) {
            Scraper::Utils::Logger::get_logger()->error("DB error getting all jobs: {}", e.what());
            throw Scraper::Utils::DatabaseException("Failed to get jobs: " + std::string(e.what()));
        }
        catch (const std::exception& e) {
            Scraper::Utils::Logger::get_logger()->error("Error getting all jobs: {}", e.what());
            throw Scraper::Utils::DatabaseException("Failed to get jobs: " + std::string(e.what()));
        } finally {
            Scraper::Database::ConnectionPool::getInstance().releaseConnection(std::move(conn_wrapper));
        }
    }

    std::optional<ScrapingJob> getJobById(const std::string& id) {
        auto conn_wrapper = Scraper::Database::ConnectionPool::getInstance().getConnection();
        pqxx::connection& conn = *conn_wrapper;
        try {
            pqxx::nontransaction w(conn);
            pqxx::result r = w.exec_params("SELECT id, user_id, name, target_url, cron_schedule, css_selector, status, last_run_message, last_run_at, created_at, updated_at FROM scraping_jobs WHERE id = $1", id);
            if (r.empty()) return std::nullopt;

            ScrapingJob job;
            job.id = r[0]["id"].as<std::string>();
            job.user_id = r[0]["user_id"].as<std::string>();
            job.name = r[0]["name"].as<std::string>();
            job.target_url = r[0]["target_url"].as<std::string>();
            job.cron_schedule = r[0]["cron_schedule"].as<std::string>();
            job.css_selector = r[0]["css_selector"].as<std::string>();
            job.status = stringToJobStatus(r[0]["status"].as<std::string>());
            if (r[0]["last_run_message"].is_null()) {
                job.last_run_message = std::nullopt;
            } else {
                job.last_run_message = r[0]["last_run_message"].as<std::string>();
            }
            if (r[0]["last_run_at"].is_null()) {
                job.last_run_at = std::nullopt;
            } else {
                job.last_run_at = fromIsoString(r[0]["last_run_at"].as<std::string>());
            }
            job.created_at = fromIsoString(r[0]["created_at"].as<std::string>());
            job.updated_at = fromIsoString(r[0]["updated_at"].as<std::string>());
            return job;
        } catch (const pqxx::sql_error& e) {
            Scraper::Utils::Logger::get_logger()->error("DB error getting job by ID: {}", e.what());
            throw Scraper::Utils::DatabaseException("Failed to get job by ID: " + std::string(e.what()));
        }
        catch (const std::exception& e) {
            Scraper::Utils::Logger::get_logger()->error("Error getting job by ID: {}", e.what());
            throw Scraper::Utils::DatabaseException("Failed to get job by ID: " + std::string(e.what()));
        } finally {
            Scraper::Database::ConnectionPool::getInstance().releaseConnection(std::move(conn_wrapper));
        }
    }

    bool updateJob(const ScrapingJob& job) {
        auto conn_wrapper = Scraper::Database::ConnectionPool::getInstance().getConnection();
        pqxx::connection& conn = *conn_wrapper;
        try {
            pqxx::work txn(conn);
            std::string query = R"(
                UPDATE scraping_jobs
                SET name = $1, target_url = $2, cron_schedule = $3, css_selector = $4, status = $5,
                    last_run_message = $6, last_run_at = $7, updated_at = $8
                WHERE id = $9 AND user_id = $10;
            )";
            pqxx::result r = txn.exec_params(query, job.name, job.target_url, job.cron_schedule, job.css_selector,
                                            jobStatusToString(job.status),
                                            job.last_run_message ? *job.last_run_message : pqxx::null<std::string>(),
                                            job.last_run_at ? toIsoString(*job.last_run_at) : pqxx::null<std::string>(),
                                            toIsoString(job.updated_at), job.id, job.user_id);
            txn.commit();
            Scraper::Utils::Logger::get_logger()->info("Scraping job updated: {}", job.id);
            return r.affected_rows() > 0;
        } catch (const pqxx::sql_error& e) {
            Scraper::Utils::Logger::get_logger()->error("DB error updating job: {}", e.what());
            throw Scraper::Utils::DatabaseException("Failed to update job: " + std::string(e.what()));
        }
        catch (const std::exception& e) {
            Scraper::Utils::Logger::get_logger()->error("Error updating job: {}", e.what());
            throw Scraper::Utils::DatabaseException("Failed to update job: " + std::string(e.what()));
        } finally {
            Scraper::Database::ConnectionPool::getInstance().releaseConnection(std::move(conn_wrapper));
        }
    }

    bool deleteJob(const std::string& id, const std::string& user_id) {
        auto conn_wrapper = Scraper::Database::ConnectionPool::getInstance().getConnection();
        pqxx::connection& conn = *conn_wrapper;
        try {
            pqxx::work txn(conn);
            pqxx::result r = txn.exec_params("DELETE FROM scraping_jobs WHERE id = $1 AND user_id = $2", id, user_id);
            txn.commit();
            Scraper::Utils::Logger::get_logger()->info("Scraping job deleted: {}", id);
            return r.affected_rows() > 0;
        } catch (const pqxx::sql_error& e) {
            Scraper::Utils::Logger::get_logger()->error("DB error deleting job: {}", e.what());
            throw Scraper::Utils::DatabaseException("Failed to delete job: " + std::string(e.what()));
        }
        catch (const std::exception& e) {
            Scraper::Utils::Logger::get_logger()->error("Error deleting job: {}", e.what());
            throw Scraper::Utils::DatabaseException("Failed to delete job: " + std::string(e.what()));
        } finally {
            Scraper::Database::ConnectionPool::getInstance().releaseConnection(std::move(conn_wrapper));
        }
    }

    // --- ScrapedData CRUD ---
    std::optional<ScrapedData> createScrapedData(const ScrapedData& data) {
        auto conn_wrapper = Scraper::Database::ConnectionPool::getInstance().getConnection();
        pqxx::connection& conn = *conn_wrapper;
        try {
            pqxx::work txn(conn);
            std::string query = R"(
                INSERT INTO scraped_data (id, job_id, url, data, scraped_at)
                VALUES ($1, $2, $3, $4, $5) RETURNING id;
            )";
            pqxx::result r = txn.exec_params(query, data.id, data.job_id, data.url, data.data.dump(), toIsoString(data.scraped_at));
            txn.commit();
            if (r.empty()) return std::nullopt;
            Scraper::Utils::Logger::get_logger()->info("Scraped data created for job_id: {}", data.job_id);
            // Re-fetch to return complete object (or construct it)
            return getScrapedDataById(r[0][0].as<std::string>());
        } catch (const pqxx::sql_error& e) {
            Scraper::Utils::Logger::get_logger()->error("DB error creating scraped data: {}", e.what());
            throw Scraper::Utils::DatabaseException("Failed to create scraped data: " + std::string(e.what()));
        }
        catch (const std::exception& e) {
            Scraper::Utils::Logger::get_logger()->error("Error creating scraped data: {}", e.what());
            throw Scraper::Utils::DatabaseException("Failed to create scraped data: " + std::string(e.what()));
        } finally {
            Scraper::Database::ConnectionPool::getInstance().releaseConnection(std::move(conn_wrapper));
        }
    }

    std::vector<ScrapedData> getScrapedDataForJob(const std::string& job_id) {
        auto conn_wrapper = Scraper::Database::ConnectionPool::getInstance().getConnection();
        pqxx::connection& conn = *conn_wrapper;
        std::vector<ScrapedData> data_list;
        try {
            pqxx::nontransaction w(conn);
            pqxx::result r = w.exec_params("SELECT id, job_id, url, data, scraped_at FROM scraped_data WHERE job_id = $1 ORDER BY scraped_at DESC", job_id);

            for (const auto& row : r) {
                ScrapedData data;
                data.id = row["id"].as<std::string>();
                data.job_id = row["job_id"].as<std::string>();
                data.url = row["url"].as<std::string>();
                data.data = nlohmann::json::parse(row["data"].as<std::string>());
                data.scraped_at = fromIsoString(row["scraped_at"].as<std::string>());
                data_list.push_back(data);
            }
            return data_list;
        } catch (const pqxx::sql_error& e) {
            Scraper::Utils::Logger::get_logger()->error("DB error getting scraped data for job: {}", e.what());
            throw Scraper::Utils::DatabaseException("Failed to get scraped data for job: " + std::string(e.what()));
        }
        catch (const std::exception& e) {
            Scraper::Utils::Logger::get_logger()->error("Error getting scraped data for job: {}", e.what());
            throw Scraper::Utils::DatabaseException("Failed to get scraped data for job: " + std::string(e.what()));
        } finally {
            Scraper::Database::ConnectionPool::getInstance().releaseConnection(std::move(conn_wrapper));
        }
    }

    std::optional<ScrapedData> getScrapedDataById(const std::string& id) {
        auto conn_wrapper = Scraper::Database::ConnectionPool::getInstance().getConnection();
        pqxx::connection& conn = *conn_wrapper;
        try {
            pqxx::nontransaction w(conn);
            pqxx::result r = w.exec_params("SELECT id, job_id, url, data, scraped_at FROM scraped_data WHERE id = $1", id);
            if (r.empty()) return std::nullopt;

            ScrapedData data;
            data.id = r[0]["id"].as<std::string>();
            data.job_id = r[0]["job_id"].as<std::string>();
            data.url = r[0]["url"].as<std::string>();
            data.data = nlohmann::json::parse(r[0]["data"].as<std::string>());
            data.scraped_at = fromIsoString(r[0]["scraped_at"].as<std::string>());
            return data;
        } catch (const pqxx::sql_error& e) {
            Scraper::Utils::Logger::get_logger()->error("DB error getting scraped data by ID: {}", e.what());
            throw Scraper::Utils::DatabaseException("Failed to get scraped data by ID: " + std::string(e.what()));
        }
        catch (const std::exception& e) {
            Scraper::Utils::Logger::get_logger()->error("Error getting scraped data by ID: {}", e.what());
            throw Scraper::Utils::DatabaseException("Failed to get scraped data by ID: " + std::string(e.what()));
        } finally {
            Scraper::Database::ConnectionPool::getInstance().releaseConnection(std::move(conn_wrapper));
        }
    }

private:
    DatabaseManager() = default;
    DatabaseManager(const DatabaseManager&) = delete;
    DatabaseManager& operator=(const DatabaseManager&) = delete;

    std::time_t timegm(std::tm* tm) const {
        // Portable implementation of timegm (converts broken-down UTC time to time_t)
        // Note: For C++20, std::chrono::utc_clock provides better support.
        // This is a common workaround for systems where timegm is not standard.
        // It temporarily changes the timezone to UTC, calls mktime, then restores it.
        // Not thread-safe without further precautions.
        // For production, consider `date.h` library or C++20 chrono.
        #ifdef _WIN32
            // Windows specific workaround, might need _putenv or SetEnvironmentVariable
            // For simplicity in a cross-platform demo, relying on default behavior or assuming Linux `timegm`.
            // Real solution needs careful handling of `_tzset`, `_mkgmtime`.
            // For now, will use mktime directly as a placeholder; it implies local time.
            // This is a known portability issue for `timegm` vs `mktime`.
            // To maintain UTC, one would adjust `tm.tm_hour` by current timezone offset before calling mktime.
            return std::mktime(tm); // WARNING: This is LOCAL time, not UTC.
        #else
            return ::timegm(tm); // Linux/Unix specific, is UTC.
        #endif
    }

};

} // namespace Database
} // namespace Scraper

#endif // DATABASE_MANAGER_H
```