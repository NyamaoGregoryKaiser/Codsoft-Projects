```cpp
#ifndef SCRAPED_DATA_H
#define SCRAPED_DATA_H

#include <string>
#include <optional>
#include <chrono>
#include <nlohmann/json.hpp>

namespace Scraper {
namespace Database {
namespace Models {

struct ScrapedData {
    std::string id; // UUID
    std::string job_id;
    std::string url; // Actual URL from which data was scraped
    nlohmann::json data; // JSON object containing extracted fields
    std::chrono::system_clock::time_point scraped_at;
};

} // namespace Models
} // namespace Database
} // namespace Scraper

#endif // SCRAPED_DATA_H
```