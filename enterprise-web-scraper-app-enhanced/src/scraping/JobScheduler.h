```cpp
#ifndef JOB_SCHEDULER_H
#define JOB_SCHEDULER_H

#include <string>
#include <vector>
#include <map>
#include <memory>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <functional>
#include <chrono>

#include "../utils/Logger.h"
#include "../utils/ErrorHandler.h"
#include "../database/models/ScrapingJob.h"
#include "../database/DatabaseManager.h"
#include "Scraper.h"

// Cron parsing library - typically an external one like 'croncpp' or a custom implementation.
// For this example, we'll use a very basic mock to simulate cron processing.
// A real system would need a robust cron parser and timer for scheduling.

namespace Scraper {
namespace Scraping {

// Forward declaration for CronEntry struct
struct CronEntry;

// Simple mock for parsing cron expressions.
// A real implementation would parse fields (minute, hour, day of month, month, day of week).
// This mock only checks if the current time matches a very simple "every X minutes/hours" concept
// or specific time. It's a placeholder.
class CronParser {
public:
    // Returns the next scheduled time point, or nullopt if parsing fails or no next time.
    std::optional<std::chrono::system_clock::time_point> getNextRunTime(const std::string& cron_schedule,
                                                                       std::chrono::system_clock::time_point last_run_or_now) {
        if (cron_schedule.empty() || cron_schedule == "manual") {
            return std::nullopt;
        }
        
        // --- MOCK CRON LOGIC ---
        // For demonstration, let's support a few simple forms:
        // "every N minutes"
        // "every N hours"
        // This is extremely basic and not a real cron parser.
        // A real cron parser would correctly handle "* * * * *" and specific times.

        auto now = std::chrono::system_clock::now();
        auto last_run = last_run_or_now;
        if (last_run == std::chrono::system_clock::time_point{}) {
            last_run = now; // If no last run, consider now as the baseline
        }

        std::istringstream iss(cron_schedule);
        std::string word1, word2, word3;
        iss >> word1 >> word2 >> word3;

        if (word1 == "every" && word3 == "minutes") {
            try {
                int minutes = std::stoi(word2);
                return last_run + std::chrono::minutes(minutes);
            } catch (const std::exception&) { /* fallthrough */ }
        } else if (word1 == "every" && word3 == "hours") {
            try {
                int hours = std::stoi(word2);
                return last_run + std::chrono::hours(hours);
            } catch (const std::exception&) { /* fallthrough */ }
        } else if (cron_schedule == "* * * * *") { // Every minute (for testing)
            return last_run + std::chrono::minutes(1);
        }
        
        Scraper::Utils::Logger::get_logger()->warn("Unsupported cron schedule format (mock): {}", cron_schedule);
        return std::nullopt;
    }
};

struct ScheduledJob {
    Scraper::Database::Models::ScrapingJob job_data;
    std::chrono::system_clock::time_point next_run_time;
    std::shared_ptr<Scraper::Scraping::Scraper> scraper_instance; // Each scheduled job might have its own scraper

    // Constructor to initialize
    ScheduledJob(const Scraper::Database::Models::ScrapingJob& job, std::shared_ptr<Scraper::Scraping::Scraper> scraper)
        : job_data(job), scraper_instance(scraper) {}
};

class JobScheduler {
public:
    static JobScheduler& getInstance() {
        static JobScheduler instance;
        return instance;
    }

    void start() {
        if (running_.exchange(true)) {
            Scraper::Utils::Logger::get_logger()->warn("JobScheduler already running.");
            return;
        }

        Scraper::Utils::Logger::get_logger()->info("JobScheduler starting...");
        loadExistingJobs(); // Load jobs from DB on startup
        worker_thread_ = std::thread(&JobScheduler::run, this);
        Scraper::Utils::Logger::get_logger()->info("JobScheduler started.");
    }

    void shutdown() {
        if (!running_.load()) {
            Scraper::Utils::Logger::get_logger()->warn("JobScheduler not running.");
            return;
        }
        Scraper::Utils::Logger::get_logger()->info("JobScheduler shutting down...");
        running_ = false;
        cv_.notify_all(); // Wake up worker thread
        if (worker_thread_.joinable()) {
            worker_thread_.join();
        }
        Scraper::Utils::Logger::get_logger()->info("JobScheduler shut down.");
    }

    void addJob(const Scraper::Database::Models::ScrapingJob& job_data) {
        std::lock_guard<std::mutex> lock(mtx_);
        if (job_data.cron_schedule.empty() || job_data.cron_schedule == "manual") {
            Scraper::Utils::Logger::get_logger()->info("Job {} is manual, not adding to scheduler.", job_data.id);
            return;
        }

        Scraper::Utils::Logger::get_logger()->info("Adding job {} to scheduler with schedule: {}", job_data.id, job_data.cron_schedule);
        auto next_run = cron_parser_.getNextRunTime(job_data.cron_schedule, job_data.last_run_at.value_or(std::chrono::system_clock::now()));
        if (next_run) {
            ScheduledJob scheduled_job(job_data, std::make_shared<Scraper::Scraping::Scraper>());
            scheduled_job.next_run_time = *next_run;
            scheduled_jobs_[job_data.id] = std::move(scheduled_job);
            Scraper::Utils::Logger::get_logger()->info("Job {} scheduled to run at {}", job_data.id, Scraper::Database::DatabaseManager::getInstance().toIsoString(*next_run));
            cv_.notify_one(); // Potentially wake up the scheduler if this job is the next to run
        } else {
            Scraper::Utils::Logger::get_logger()->error("Failed to parse cron schedule for job {}: {}", job_data.id, job_data.cron_schedule);
        }
    }

    void updateJob(const Scraper::Database::Models::ScrapingJob& job_data) {
        std::lock_guard<std::mutex> lock(mtx_);
        removeJob(job_data.id); // Remove old entry
        addJob(job_data);       // Add new entry with updated schedule
        Scraper::Utils::Logger::get_logger()->info("Job {} updated in scheduler.", job_data.id);
    }

    void removeJob(const std::string& job_id) {
        std::lock_guard<std::mutex> lock(mtx_);
        if (scheduled_jobs_.count(job_id)) {
            scheduled_jobs_.erase(job_id);
            Scraper::Utils::Logger::get_logger()->info("Job {} removed from scheduler.", job_id);
            cv_.notify_one(); // Potentially wake up the scheduler if the removed job was the next
        }
    }

    // Immediately triggers a job. This is for API calls like /jobs/:id/run
    void triggerJob(const std::string& job_id) {
        std::lock_guard<std::mutex> lock(mtx_);
        // Check if job exists and can be run.
        auto job_opt = Scraper::Database::DatabaseManager::getInstance().getJobById(job_id);
        if (!job_opt) {
            throw Scraper::Utils::NotFoundException("Job " + job_id + " not found.");
        }
        
        // For immediate trigger, we create a temporary ScheduledJob and push it to a dedicated
        // queue or run it in a new thread immediately.
        // For this demo, let's directly execute it in a new thread.
        Scraper::Utils::Logger::get_logger()->info("Manually triggering job: {}", job_id);
        std::thread([this, job = *job_opt]() mutable {
            Scraper::Scraping::Scraper scraper_instance; // New scraper for this thread
            try {
                scraper_instance.runJob(job); // Pass by value to avoid race conditions with scheduler
            } catch (const std::exception& e) {
                Scraper::Utils::Logger::get_logger()->error("Manual trigger for job {} failed: {}", job.id, e.what());
                // Update job status to FAILED in DB if not already done by runJob
            }
        }).detach();
    }

private:
    JobScheduler() : running_(false) {}
    ~JobScheduler() {
        shutdown();
    }

    JobScheduler(const JobScheduler&) = delete;
    JobScheduler& operator=(const JobScheduler&) = delete;

    void run() {
        auto logger = Scraper::Utils::Logger::get_logger();
        while (running_) {
            std::unique_lock<std::mutex> lock(mtx_);

            // Find the next job to run
            std::string next_job_id_to_run;
            std::chrono::system_clock::time_point now = std::chrono::system_clock::now();
            std::chrono::system_clock::time_point soonest_run_time = std::chrono::system_clock::time_point::max();

            for (auto const& [job_id, scheduled_job] : scheduled_jobs_) {
                if (scheduled_job.next_run_time < soonest_run_time) {
                    soonest_run_time = scheduled_job.next_run_time;
                    next_job_id_to_run = job_id;
                }
            }

            if (next_job_id_to_run.empty() || soonest_run_time == std::chrono::system_clock::time_point::max()) {
                // No jobs scheduled, wait indefinitely (or until new job added)
                logger->debug("No jobs scheduled. Scheduler waiting...");
                cv_.wait(lock, [this]{ return !running_ || !scheduled_jobs_.empty(); });
            } else if (soonest_run_time > now) {
                // Next job is in the future, wait until then
                auto wait_duration = soonest_run_time - now;
                logger->debug("Next job {} scheduled in {} seconds. Scheduler waiting...",
                              next_job_id_to_run, std::chrono::duration_cast<std::chrono::seconds>(wait_duration).count());
                cv_.wait_for(lock, wait_duration, [this, soonest_run_time]{
                    return !running_ || std::chrono::system_clock::now() >= soonest_run_time;
                });
            }

            if (!running_) break; // Check again if shutdown was requested while waiting

            // If we woke up because time has come, or a new job was added that is sooner
            now = std::chrono::system_clock::now(); // Update current time
            if (!next_job_id_to_run.empty() && scheduled_jobs_.count(next_job_id_to_run) && scheduled_jobs_[next_job_id_to_run].next_run_time <= now) {
                ScheduledJob job_to_run = scheduled_jobs_[next_job_id_to_run]; // Copy job details
                // Update next_run_time immediately to prevent duplicate runs if processing takes time
                auto next_schedule = cron_parser_.getNextRunTime(job_to_run.job_data.cron_schedule, now);
                if (next_schedule) {
                    scheduled_jobs_[next_job_id_to_run].next_run_time = *next_schedule;
                    logger->debug("Job {} re-scheduled for next run at {}", job_to_run.job_data.id, Scraper::Database::DatabaseManager::getInstance().toIsoString(*next_schedule));
                } else {
                    // If no next schedule, it's a one-time job or invalid cron, remove it from scheduler.
                    scheduled_jobs_.erase(next_job_id_to_run);
                    logger->warn("Job {} has no next run time, removing from scheduler.", job_to_run.job_data.id);
                }
                
                lock.unlock(); // Release lock before running scraper as it might take time
                executeJob(job_to_run);
                lock.lock(); // Reacquire lock
            }
        }
    }

    void executeJob(ScheduledJob job_entry) {
        auto logger = Scraper::Utils::Logger::get_logger();
        logger->info("Executing scheduled job: {} (ID: {})", job_entry.job_data.name, job_entry.job_data.id);
        
        // Execute in a separate thread to not block the scheduler's main loop
        // Detached thread, care must be taken that `scraper_instance` and `job_data` are safe.
        // `job_entry` is a copy, so `job_data` is safe. `scraper_instance` is shared_ptr.
        std::thread([this, job_entry]() mutable {
            try {
                // Fetch the latest job data from DB before running, in case it was updated
                std::optional<Scraper::Database::Models::ScrapingJob> current_job_data = Scraper::Database::DatabaseManager::getInstance().getJobById(job_entry.job_data.id);
                if (!current_job_data) {
                    logger->error("Scheduled job {} not found in database, cannot execute.", job_entry.job_data.id);
                    return;
                }
                // Only run if job status allows (e.g., not CANCELLED or FAILED intentionally)
                if (current_job_data->status == Scraper::Database::Models::JobStatus::CANCELLED) {
                    logger->info("Scheduled job {} is CANCELLED, skipping execution.", current_job_data->id);
                    return;
                }
                // Call the scraper with the latest job data
                job_entry.scraper_instance->runJob(*current_job_data);
            } catch (const Scraper::Utils::ScrapingException& e) {
                logger->error("Error running scheduled job {}: {}", job_entry.job_data.id, e.what());
            } catch (const std::exception& e) {
                logger->error("Unexpected error in scheduled job {}: {}", job_entry.job_data.id, e.what());
            }
        }).detach();
    }

    void loadExistingJobs() {
        auto logger = Scraper::Utils::Logger::get_logger();
        logger->info("Loading existing scraping jobs from database for scheduling...");
        try {
            std::vector<Scraper::Database::Models::ScrapingJob> jobs = Scraper::Database::DatabaseManager::getInstance().getAllJobs();
            for (const auto& job : jobs) {
                if (!job.cron_schedule.empty() && job.cron_schedule != "manual") {
                    addJob(job); // Re-add to scheduler
                }
            }
            logger->info("Loaded {} jobs into scheduler.", scheduled_jobs_.size());
        } catch (const Scraper::Utils::DatabaseException& e) {
            logger->error("Failed to load existing jobs from database: {}", e.what());
        }
    }

    std::map<std::string, ScheduledJob> scheduled_jobs_; // Map from job ID to ScheduledJob
    std::mutex mtx_;
    std::condition_variable cv_;
    std::atomic<bool> running_;
    std::thread worker_thread_;
    CronParser cron_parser_; // Simple mock cron parser
};

} // namespace Scraping
} // namespace Scraper

#endif // JOB_SCHEDULER_H
```