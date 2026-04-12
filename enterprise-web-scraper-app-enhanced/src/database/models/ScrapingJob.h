```cpp
#ifndef SCRAPING_JOB_H
#define SCRAPING_JOB_H

#include <string>
#include <vector>
#include <optional>
#include <chrono>

namespace Scraper {
namespace Database {
namespace Models {

enum class JobStatus {
    PENDING,
    RUNNING,
    COMPLETED,
    FAILED,
    CANCELLED
};

inline std::string jobStatusToString(JobStatus status) {
    switch (status) {
        case JobStatus::PENDING: return "PENDING";
        case JobStatus::RUNNING: return "RUNNING";
        case JobStatus::COMPLETED: return "COMPLETED";
        case JobStatus::FAILED: return "FAILED";
        case JobStatus::CANCELLED: return "CANCELLED";
        default: return "UNKNOWN";
    }
}

inline JobStatus stringToJobStatus(const std::string& status_str) {
    if (status_str == "PENDING") return JobStatus::PENDING;
    if (status_str == "RUNNING") return JobStatus::RUNNING;
    if (status_str == "COMPLETED") return JobStatus::COMPLETED;
    if (status_str == "FAILED") return JobStatus::FAILED;
    if (status_str == "CANCELLED") return JobStatus::CANCELLED;
    return JobStatus::FAILED; // Default or error state
}

struct ScrapingJob {
    std::string id; // UUID
    std::string user_id;
    std::string name;
    std::string target_url;
    std::string cron_schedule; // e.g., "0 0 * * *" for daily
    std::string css_selector; // CSS selector for data extraction
    JobStatus status;
    std::optional<std::string> last_run_message;
    std::optional<std::chrono::system_clock::time_point> last_run_at;
    std::chrono::system_clock::time_point created_at;
    std::chrono::system_clock::time_point updated_at;
};

} // namespace Models
} // namespace Database
} // namespace Scraper

#endif // SCRAPING_JOB_H
```