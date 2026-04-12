```cpp
#ifndef JOB_CONTROLLER_H
#define JOB_CONTROLLER_H

#include <pistache/router.h>
#include <nlohmann/json.hpp>
#include "../../database/DatabaseManager.h"
#include "../../database/models/ScrapingJob.h"
#include "../../utils/Logger.h"
#include "../../utils/ErrorHandler.h"
#include "../DTOs.h"
#include "../middleware/AuthMiddleware.h" // For AuthRequest
#include "../../scraping/JobScheduler.h" // To trigger jobs

namespace Scraper {
namespace API {
namespace Controllers {

class JobController {
public:
    void setupRoutes(Pistache::Rest::Router& router) {
        Pistache::Rest::Routes::Get(router, "/api/v1/jobs",
                                    Pistache::Rest::Routes::bind(&JobController::handleGetAllJobs, this));
        Pistache::Rest::Routes::Post(router, "/api/v1/jobs",
                                     Pistache::Rest::Routes::bind(&JobController::handleCreateJob, this));
        Pistache::Rest::Routes::Get(router, "/api/v1/jobs/:id",
                                    Pistache::Rest::Routes::bind(&JobController::handleGetJobById, this));
        Pistache::Rest::Routes::Put(router, "/api/v1/jobs/:id",
                                    Pistache::Rest::Routes::bind(&JobController::handleUpdateJob, this));
        Pistache::Rest::Routes::Delete(router, "/api/v1/jobs/:id",
                                       Pistache::Rest::Routes::bind(&JobController::handleDeleteJob, this));
        Pistache::Rest::Routes::Post(router, "/api/v1/jobs/:id/run",
                                      Pistache::Rest::Routes::bind(&JobController::handleRunJob, this));
    }

private:
    void handleGetAllJobs(const Scraper::API::Middleware::AuthRequest& request, Pistache::Http::ResponseWriter response) {
        auto logger = Scraper::Utils::Logger::get_logger();
        try {
            // User payload is guaranteed to be present by AuthMiddleware
            std::string user_id = request.user_payload->user_id;
            std::vector<Scraper::Database::Models::ScrapingJob> jobs = Scraper::Database::DatabaseManager::getInstance().getAllJobs(user_id);

            nlohmann::json response_json = nlohmann::json::array();
            for (const auto& job : jobs) {
                response_json.push_back(DTOs::toJson(job));
            }
            response.send(Pistache::Http::Code::Ok, response_json.dump(), Pistache::Http::Mime::MediaType("application/json"));
        } catch (const Scraper::Utils::ScraperException& e) {
            response.send(e.what() == std::string("Failed to get jobs: ") ? Pistache::Http::Code::InternalServerError : Pistache::Http::Code::BadRequest, // Simplified error code mapping
                          Scraper::Utils::exceptionToJson(e, 500).dump(),
                          Pistache::Http::Mime::MediaType("application/json"));
        } catch (const std::exception& e) {
            logger->error("Unhandled exception in handleGetAllJobs: {}", e.what());
            response.send(Pistache::Http::Code::InternalServerError,
                          Scraper::Utils::exceptionToJson(Scraper::Utils::ScraperException("Internal server error."), 500).dump(),
                          Pistache::Http::Mime::MediaType("application/json"));
        }
    }

    void handleCreateJob(const Scraper::API::Middleware::AuthRequest& request, Pistache::Http::ResponseWriter response) {
        auto logger = Scraper::Utils::Logger::get_logger();
        try {
            std::string user_id = request.user_payload->user_id;
            DTOs::CreateJobRequest req = DTOs::CreateJobRequest::fromJson(nlohmann::json::parse(request.body()));

            Scraper::Database::Models::ScrapingJob new_job;
            new_job.id = Scraper::Database::DatabaseManager::getInstance().generateUuid();
            new_job.user_id = user_id;
            new_job.name = req.name;
            new_job.target_url = req.target_url;
            new_job.cron_schedule = req.cron_schedule;
            new_job.css_selector = req.css_selector;
            new_job.status = Scraper::Database::Models::JobStatus::PENDING;
            new_job.created_at = std::chrono::system_clock::now();
            new_job.updated_at = std::chrono::system_clock::now();

            std::optional<Scraper::Database::Models::ScrapingJob> created_job = Scraper::Database::DatabaseManager::getInstance().createJob(new_job);

            if (created_job) {
                // Add job to scheduler if it has a cron schedule
                if (!created_job->cron_schedule.empty() && created_job->cron_schedule != "manual") {
                    Scraper::Scraping::JobScheduler::getInstance().addJob(*created_job);
                }
                response.send(Pistache::Http::Code::Created, DTOs::toJson(*created_job).dump(), Pistache::Http::Mime::MediaType("application/json"));
            } else {
                logger->error("Failed to create job for user {}: {}", user_id, req.name);
                throw Scraper::Utils::ScraperException("Failed to create job.");
            }
        } catch (const nlohmann::json::exception& e) {
            logger->error("JSON parsing error: {}", e.what());
            response.send(Pistache::Http::Code::BadRequest,
                          Scraper::Utils::exceptionToJson(Scraper::Utils::BadRequestException("Invalid JSON format."), 400).dump(),
                          Pistache::Http::Mime::MediaType("application/json"));
        } catch (const Scraper::Utils::ScraperException& e) {
            response.send(Pistache::Http::Code::InternalServerError,
                          Scraper::Utils::exceptionToJson(e, 500).dump(),
                          Pistache::Http::Mime::MediaType("application/json"));
        } catch (const std::exception& e) {
            logger->error("Unhandled exception in handleCreateJob: {}", e.what());
            response.send(Pistache::Http::Code::InternalServerError,
                          Scraper::Utils::exceptionToJson(Scraper::Utils::ScraperException("Internal server error."), 500).dump(),
                          Pistache::Http::Mime::MediaType("application/json"));
        }
    }

    void handleGetJobById(const Scraper::API::Middleware::AuthRequest& request, Pistache::Http::ResponseWriter response) {
        auto logger = Scraper::Utils::Logger::get_logger();
        try {
            std::string job_id = request.param(":id").as<std::string>();
            std::string user_id = request.user_payload->user_id; // For authorization check

            std::optional<Scraper::Database::Models::ScrapingJob> job = Scraper::Database::DatabaseManager::getInstance().getJobById(job_id);

            if (!job || job->user_id != user_id) { // Ensure job belongs to the authenticated user
                throw Scraper::Utils::NotFoundException("Job not found or not authorized.");
            }

            response.send(Pistache::Http::Code::Ok, DTOs::toJson(*job).dump(), Pistache::Http::Mime::MediaType("application/json"));
        } catch (const Scraper::Utils::NotFoundException& e) {
            response.send(Pistache::Http::Code::NotFound,
                          Scraper::Utils::exceptionToJson(e, 404).dump(),
                          Pistache::Http::Mime::MediaType("application/json"));
        } catch (const Scraper::Utils::ScraperException& e) {
            response.send(Pistache::Http::Code::InternalServerError,
                          Scraper::Utils::exceptionToJson(e, 500).dump(),
                          Pistache::Http::Mime::MediaType("application/json"));
        } catch (const std::exception& e) {
            logger->error("Unhandled exception in handleGetJobById: {}", e.what());
            response.send(Pistache::Http::Code::InternalServerError,
                          Scraper::Utils::exceptionToJson(Scraper::Utils::ScraperException("Internal server error."), 500).dump(),
                          Pistache::Http::Mime::MediaType("application/json"));
        }
    }

    void handleUpdateJob(const Scraper::API::Middleware::AuthRequest& request, Pistache::Http::ResponseWriter response) {
        auto logger = Scraper::Utils::Logger::get_logger();
        try {
            std::string job_id = request.param(":id").as<std::string>();
            std::string user_id = request.user_payload->user_id;

            std::optional<Scraper::Database::Models::ScrapingJob> existing_job = Scraper::Database::DatabaseManager::getInstance().getJobById(job_id);
            if (!existing_job || existing_job->user_id != user_id) {
                throw Scraper::Utils::NotFoundException("Job not found or not authorized.");
            }

            DTOs::UpdateJobRequest req = DTOs::UpdateJobRequest::fromJson(nlohmann::json::parse(request.body()));

            if (!req.name.empty()) existing_job->name = req.name;
            if (!req.target_url.empty()) existing_job->target_url = req.target_url;
            if (!req.cron_schedule.empty()) existing_job->cron_schedule = req.cron_schedule;
            if (!req.css_selector.empty()) existing_job->css_selector = req.css_selector;
            if (!req.status.empty()) existing_job->status = Scraper::Database::Models::stringToJobStatus(req.status);
            existing_job->updated_at = std::chrono::system_clock::now();

            bool updated = Scraper::Database::DatabaseManager::getInstance().updateJob(*existing_job);

            if (updated) {
                // Update scheduler if cron schedule changed
                if (!existing_job->cron_schedule.empty() && existing_job->cron_schedule != "manual") {
                    Scraper::Scraping::JobScheduler::getInstance().updateJob(*existing_job);
                } else {
                    Scraper::Scraping::JobScheduler::getInstance().removeJob(existing_job->id);
                }

                response.send(Pistache::Http::Code::Ok, DTOs::toJson(*existing_job).dump(), Pistache::Http::Mime::MediaType("application/json"));
            } else {
                logger->error("Failed to update job {}: No rows affected.", job_id);
                throw Scraper::Utils::ScraperException("Failed to update job.");
            }
        } catch (const nlohmann::json::exception& e) {
            logger->error("JSON parsing error: {}", e.what());
            response.send(Pistache::Http::Code::BadRequest,
                          Scraper::Utils::exceptionToJson(Scraper::Utils::BadRequestException("Invalid JSON format."), 400).dump(),
                          Pistache::Http::Mime::MediaType("application/json"));
        } catch (const Scraper::Utils::NotFoundException& e) {
            response.send(Pistache::Http::Code::NotFound,
                          Scraper::Utils::exceptionToJson(e, 404).dump(),
                          Pistache::Http::Mime::MediaType("application/json"));
        } catch (const Scraper::Utils::ScraperException& e) {
            response.send(Pistache::Http::Code::InternalServerError,
                          Scraper::Utils::exceptionToJson(e, 500).dump(),
                          Pistache::Http::Mime::MediaType("application/json"));
        } catch (const std::exception& e) {
            logger->error("Unhandled exception in handleUpdateJob: {}", e.what());
            response.send(Pistache::Http::Code::InternalServerError,
                          Scraper::Utils::exceptionToJson(Scraper::Utils::ScraperException("Internal server error."), 500).dump(),
                          Pistache::Http::Mime::MediaType("application/json"));
        }
    }

    void handleDeleteJob(const Scraper::API::Middleware::AuthRequest& request, Pistache::Http::ResponseWriter response) {
        auto logger = Scraper::Utils::Logger::get_logger();
        try {
            std::string job_id = request.param(":id").as<std::string>();
            std::string user_id = request.user_payload->user_id;

            bool deleted = Scraper::Database::DatabaseManager::getInstance().deleteJob(job_id, user_id);

            if (deleted) {
                Scraper::Scraping::JobScheduler::getInstance().removeJob(job_id);
                response.send(Pistache::Http::Code::NoContent);
            } else {
                throw Scraper::Utils::NotFoundException("Job not found or not authorized.");
            }
        } catch (const Scraper::Utils::NotFoundException& e) {
            response.send(Pistache::Http::Code::NotFound,
                          Scraper::Utils::exceptionToJson(e, 404).dump(),
                          Pistache::Http::Mime::MediaType("application/json"));
        } catch (const Scraper::Utils::ScraperException& e) {
            response.send(Pistache::Http::Code::InternalServerError,
                          Scraper::Utils::exceptionToJson(e, 500).dump(),
                          Pistache::Http::Mime::MediaType("application/json"));
        } catch (const std::exception& e) {
            logger->error("Unhandled exception in handleDeleteJob: {}", e.what());
            response.send(Pistache::Http::Code::InternalServerError,
                          Scraper::Utils::exceptionToJson(Scraper::Utils::ScraperException("Internal server error."), 500).dump(),
                          Pistache::Http::Mime::MediaType("application/json"));
        }
    }

    void handleRunJob(const Scraper::API::Middleware::AuthRequest& request, Pistache::Http::ResponseWriter response) {
        auto logger = Scraper::Utils::Logger::get_logger();
        try {
            std::string job_id = request.param(":id").as<std::string>();
            std::string user_id = request.user_payload->user_id;

            std::optional<Scraper::Database::Models::ScrapingJob> job = Scraper::Database::DatabaseManager::getInstance().getJobById(job_id);
            if (!job || job->user_id != user_id) {
                throw Scraper::Utils::NotFoundException("Job not found or not authorized.");
            }

            // Trigger the job immediately in the scheduler
            Scraper::Scraping::JobScheduler::getInstance().triggerJob(job_id);
            
            response.send(Pistache::Http::Code::Ok, nlohmann::json({{"message", "Scraping job triggered successfully."}}).dump(), Pistache::Http::Mime::MediaType("application/json"));

        } catch (const Scraper::Utils::NotFoundException& e) {
            response.send(Pistache::Http::Code::NotFound,
                          Scraper::Utils::exceptionToJson(e, 404).dump(),
                          Pistache::Http::Mime::MediaType("application/json"));
        } catch (const Scraper::Utils::ScrapingException& e) {
             response.send(Pistache::Http::Code::InternalServerError,
                          Scraper::Utils::exceptionToJson(e, 500).dump(),
                          Pistache::Http::Mime::MediaType("application/json"));
        } catch (const Scraper::Utils::ScraperException& e) {
            response.send(Pistache::Http::Code::InternalServerError,
                          Scraper::Utils::exceptionToJson(e, 500).dump(),
                          Pistache::Http::Mime::MediaType("application/json"));
        } catch (const std::exception& e) {
            logger->error("Unhandled exception in handleRunJob: {}", e.what());
            response.send(Pistache::Http::Code::InternalServerError,
                          Scraper::Utils::exceptionToJson(Scraper::Utils::ScraperException("Internal server error."), 500).dump(),
                          Pistache::Http::Mime::MediaType("application/json"));
        }
    }
};

} // namespace Controllers
} // namespace API
} // namespace Scraper

#endif // JOB_CONTROLLER_H
```