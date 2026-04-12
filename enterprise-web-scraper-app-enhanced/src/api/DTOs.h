```cpp
#ifndef DTOS_H
#define DTOS_H

#include <string>
#include <vector>
#include <nlohmann/json.hpp>
#include "../database/models/User.h"
#include "../database/models/ScrapingJob.h"
#include "../database/models/ScrapedData.h"

// Data Transfer Objects for API requests and responses

namespace Scraper {
namespace API {
namespace DTOs {

// --- Auth DTOs ---
struct RegisterRequest {
    std::string username;
    std::string email;
    std::string password;

    static RegisterRequest fromJson(const nlohmann::json& j) {
        RegisterRequest req;
        j.at("username").get_to(req.username);
        j.at("email").get_to(req.email);
        j.at("password").get_to(req.password);
        return req;
    }
};

struct LoginRequest {
    std::string username;
    std::string password;

    static LoginRequest fromJson(const nlohmann::json& j) {
        LoginRequest req;
        j.at("username").get_to(req.username);
        j.at("password").get_to(req.password);
        return req;
    }
};

struct AuthResponse {
    std::string token;
    std::string message;

    nlohmann::json toJson() const {
        nlohmann::json j;
        j["token"] = token;
        j["message"] = message;
        return j;
    }
};

// --- Job DTOs ---
struct CreateJobRequest {
    std::string name;
    std::string target_url;
    std::string cron_schedule;
    std::string css_selector;

    static CreateJobRequest fromJson(const nlohmann::json& j) {
        CreateJobRequest req;
        j.at("name").get_to(req.name);
        j.at("target_url").get_to(req.target_url);
        j.at("cron_schedule").get_to(req.cron_schedule);
        j.at("css_selector").get_to(req.css_selector);
        return req;
    }
};

struct UpdateJobRequest {
    std::string name;
    std::string target_url;
    std::string cron_schedule;
    std::string css_selector;
    std::string status; // Representing JobStatus as string

    static UpdateJobRequest fromJson(const nlohmann::json& j) {
        UpdateJobRequest req;
        if (j.contains("name")) j.at("name").get_to(req.name);
        if (j.contains("target_url")) j.at("target_url").get_to(req.target_url);
        if (j.contains("cron_schedule")) j.at("cron_schedule").get_to(req.cron_schedule);
        if (j.contains("css_selector")) j.at("css_selector").get_to(req.css_selector);
        if (j.contains("status")) j.at("status").get_to(req.status);
        return req;
    }
};

// Common serialization for models
nlohmann::json toJson(const Scraper::Database::Models::User& user) {
    nlohmann::json j;
    j["id"] = user.id;
    j["username"] = user.username;
    j["email"] = user.email;
    j["created_at"] = Scraper::Database::DatabaseManager::getInstance().toIsoString(user.created_at);
    j["updated_at"] = Scraper::Database::DatabaseManager::getInstance().toIsoString(user.updated_at);
    return j;
}

nlohmann::json toJson(const Scraper::Database::Models::ScrapingJob& job) {
    nlohmann::json j;
    j["id"] = job.id;
    j["user_id"] = job.user_id;
    j["name"] = job.name;
    j["target_url"] = job.target_url;
    j["cron_schedule"] = job.cron_schedule;
    j["css_selector"] = job.css_selector;
    j["status"] = Scraper::Database::Models::jobStatusToString(job.status);
    if (job.last_run_message) j["last_run_message"] = *job.last_run_message;
    if (job.last_run_at) j["last_run_at"] = Scraper::Database::DatabaseManager::getInstance().toIsoString(*job.last_run_at);
    j["created_at"] = Scraper::Database::DatabaseManager::getInstance().toIsoString(job.created_at);
    j["updated_at"] = Scraper::Database::DatabaseManager::getInstance().toIsoString(job.updated_at);
    return j;
}

nlohmann::json toJson(const Scraper::Database::Models::ScrapedData& data) {
    nlohmann::json j;
    j["id"] = data.id;
    j["job_id"] = data.job_id;
    j["url"] = data.url;
    j["data"] = data.data; // nlohmann::json handles itself
    j["scraped_at"] = Scraper::Database::DatabaseManager::getInstance().toIsoString(data.scraped_at);
    return j;
}


} // namespace DTOs
} // namespace API
} // namespace Scraper

#endif // DTOS_H
```