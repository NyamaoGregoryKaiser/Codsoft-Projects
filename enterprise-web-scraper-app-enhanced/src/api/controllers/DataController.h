```cpp
#ifndef DATA_CONTROLLER_H
#define DATA_CONTROLLER_H

#include <pistache/router.h>
#include <nlohmann/json.hpp>
#include "../../database/DatabaseManager.h"
#include "../../database/models/ScrapedData.h"
#include "../../utils/Logger.h"
#include "../../utils/ErrorHandler.h"
#include "../DTOs.h"
#include "../middleware/AuthMiddleware.h" // For AuthRequest

namespace Scraper {
namespace API {
namespace Controllers {

class DataController {
public:
    void setupRoutes(Pistache::Rest::Router& router) {
        Pistache::Rest::Routes::Get(router, "/api/v1/data/:job_id",
                                    Pistache::Rest::Routes::bind(&DataController::handleGetScrapedDataForJob, this));
        Pistache::Rest::Routes::Get(router, "/api/v1/data/:job_id/:id",
                                    Pistache::Rest::Routes::bind(&DataController::handleGetScrapedDataById, this));
    }

private:
    void handleGetScrapedDataForJob(const Scraper::API::Middleware::AuthRequest& request, Pistache::Http::ResponseWriter response) {
        auto logger = Scraper::Utils::Logger::get_logger();
        try {
            std::string job_id = request.param(":job_id").as<std::string>();
            std::string user_id = request.user_payload->user_id; // For authorization check

            // First, verify the job exists and belongs to the user
            std::optional<Scraper::Database::Models::ScrapingJob> job = Scraper::Database::DatabaseManager::getInstance().getJobById(job_id);
            if (!job || job->user_id != user_id) {
                throw Scraper::Utils::NotFoundException("Job not found or not authorized to view data for this job.");
            }

            std::vector<Scraper::Database::Models::ScrapedData> data_list = Scraper::Database::DatabaseManager::getInstance().getScrapedDataForJob(job_id);

            nlohmann::json response_json = nlohmann::json::array();
            for (const auto& data : data_list) {
                response_json.push_back(DTOs::toJson(data));
            }
            response.send(Pistache::Http::Code::Ok, response_json.dump(), Pistache::Http::Mime::MediaType("application/json"));
        } catch (const Scraper::Utils::NotFoundException& e) {
            response.send(Pistache::Http::Code::NotFound,
                          Scraper::Utils::exceptionToJson(e, 404).dump(),
                          Pistache::Http::Mime::MediaType("application/json"));
        } catch (const Scraper::Utils::ScraperException& e) {
            response.send(Pistache::Http::Code::InternalServerError,
                          Scraper::Utils::exceptionToJson(e, 500).dump(),
                          Pistache::Http::Mime::MediaType("application/json"));
        } catch (const std::exception& e) {
            logger->error("Unhandled exception in handleGetScrapedDataForJob: {}", e.what());
            response.send(Pistache::Http::Code::InternalServerError,
                          Scraper::Utils::exceptionToJson(Scraper::Utils::ScraperException("Internal server error."), 500).dump(),
                          Pistache::Http::Mime::MediaType("application/json"));
        }
    }

    void handleGetScrapedDataById(const Scraper::API::Middleware::AuthRequest& request, Pistache::Http::ResponseWriter response) {
        auto logger = Scraper::Utils::Logger::get_logger();
        try {
            std::string job_id = request.param(":job_id").as<std::string>();
            std::string data_id = request.param(":id").as<std::string>();
            std::string user_id = request.user_payload->user_id;

            // Verify the job exists and belongs to the user
            std::optional<Scraper::Database::Models::ScrapingJob> job = Scraper::Database::DatabaseManager::getInstance().getJobById(job_id);
            if (!job || job->user_id != user_id) {
                throw Scraper::Utils::NotFoundException("Job not found or not authorized to view data for this job.");
            }

            // Get the specific scraped data entry
            std::optional<Scraper::Database::Models::ScrapedData> data = Scraper::Database::DatabaseManager::getInstance().getScrapedDataById(data_id);

            if (!data || data->job_id != job_id) { // Also ensure data belongs to the correct job
                throw Scraper::Utils::NotFoundException("Scraped data entry not found or does not belong to the specified job.");
            }

            response.send(Pistache::Http::Code::Ok, DTOs::toJson(*data).dump(), Pistache::Http::Mime::MediaType("application/json"));
        } catch (const Scraper::Utils::NotFoundException& e) {
            response.send(Pistache::Http::Code::NotFound,
                          Scraper::Utils::exceptionToJson(e, 404).dump(),
                          Pistache::Http::Mime::MediaType("application/json"));
        } catch (const Scraper::Utils::ScraperException& e) {
            response.send(Pistache::Http::Code::InternalServerError,
                          Scraper::Utils::exceptionToJson(e, 500).dump(),
                          Pistache::Http::Mime::MediaType("application/json"));
        } catch (const std::exception& e) {
            logger->error("Unhandled exception in handleGetScrapedDataById: {}", e.what());
            response.send(Pistache::Http::Code::InternalServerError,
                          Scraper::Utils::exceptionToJson(Scraper::Utils::ScraperException("Internal server error."), 500).dump(),
                          Pistache::Http::Mime::MediaType("application/json"));
        }
    }
};

} // namespace Controllers
} // namespace API
} // namespace Scraper

#endif // DATA_CONTROLLER_H
```