```cpp
#ifndef SCRAPER_H
#define SCRAPER_H

#include <string>
#include <optional>
#include <nlohmann/json.hpp>
#include "../utils/Logger.h"
#include "../utils/ErrorHandler.h"
#include "../database/DatabaseManager.h"
#include "../database/models/ScrapingJob.h"
#include "../database/models/ScrapedData.h"
#include "HttpFetcher.h"
#include "HtmlParser.h"

namespace Scraper {
namespace Scraping {

class Scraper {
public:
    Scraper() : fetcher_(), parser_() {
        Scraper::Utils::Logger::get_logger()->info("Scraper instance created.");
    }

    std::optional<Scraper::Database::Models::ScrapedData> runJob(Scraper::Database::Models::ScrapingJob& job) {
        auto logger = Scraper::Utils::Logger::get_logger();
        logger->info("Starting scraping job: {} (ID: {}) for URL: {}", job.name, job.id, job.target_url);

        job.status = Scraper::Database::Models::JobStatus::RUNNING;
        job.last_run_message = "Job started.";
        job.updated_at = std::chrono::system_clock::now();
        Scraper::Database::DatabaseManager::getInstance().updateJob(job);

        std::optional<Scraper::Database::Models::ScrapedData> result_data = std::nullopt;
        try {
            std::string html_content = fetcher_.fetch(job.target_url);
            nlohmann::json extracted_json = parser_.parseAndExtract(html_content, job.css_selector);

            Scraper::Database::Models::ScrapedData new_data;
            new_data.id = Scraper::Database::DatabaseManager::getInstance().generateUuid();
            new_data.job_id = job.id;
            new_data.url = job.target_url;
            new_data.data = extracted_json;
            new_data.scraped_at = std::chrono::system_clock::now();

            result_data = Scraper::Database::DatabaseManager::getInstance().createScrapedData(new_data);

            job.status = Scraper::Database::Models::JobStatus::COMPLETED;
            job.last_run_message = "Successfully scraped " + std::to_string(extracted_json.size()) + " items.";
            job.last_run_at = std::chrono::system_clock::now();
            job.updated_at = std::chrono::system_clock::now();
            Scraper::Database::DatabaseManager::getInstance().updateJob(job);
            
            logger->info("Scraping job {} completed successfully. Data ID: {}", job.id, result_data->id);

        } catch (const Scraper::Utils::ScrapingException& e) {
            job.status = Scraper::Database::Models::JobStatus::FAILED;
            job.last_run_message = "Scraping failed: " + std::string(e.what());
            job.last_run_at = std::chrono::system_clock::now();
            job.updated_at = std::chrono::system_clock::now();
            Scraper::Database::DatabaseManager::getInstance().updateJob(job);
            logger->error("Scraping job {} failed: {}", job.id, e.what());
            throw; // Re-throw to be caught by scheduler or API handler
        } catch (const std::exception& e) {
            job.status = Scraper::Database::Models::JobStatus::FAILED;
            job.last_run_message = "An unexpected error occurred: " + std::string(e.what());
            job.last_run_at = std::chrono::system_clock::now();
            job.updated_at = std::chrono::system_clock::now();
            Scraper::Database::DatabaseManager::getInstance().updateJob(job);
            logger->error("Scraping job {} encountered an unexpected error: {}", job.id, e.what());
            throw Scraper::Utils::ScrapingException("Unexpected error during scraping: " + std::string(e.what()));
        }
        return result_data;
    }

private:
    HttpFetcher fetcher_;
    HtmlParser parser_;
};

} // namespace Scraping
} // namespace Scraper

#endif // SCRAPER_H
```