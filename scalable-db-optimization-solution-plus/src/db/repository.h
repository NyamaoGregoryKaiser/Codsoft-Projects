```cpp
#ifndef OPTIDB_REPOSITORY_H
#define OPTIDB_REPOSITORY_H

#include "db/postgres_connection.h"
#include "models/base_model.h"
#include "utils/logger.h"
#include <memory>
#include <string>
#include <vector>
#include <pqxx/pqxx>
#include <chrono>

// Generic Repository interface (optional, but good for larger projects)
// For this example, we'll implement specific repositories directly.

// Helper function to convert pqxx::result::field to chrono::system_clock::time_point
static std::chrono::system_clock::time_point parse_timestamp(const pqxx::result::field& f) {
    if (f.is_null()) {
        return std::chrono::system_clock::time_point(); // Return epoch or throw
    }
    // pqxx generally handles timestamp string to time_t conversion implicitly if assigned to time_t
    // For C++11 chrono, manual parsing might be needed for precise control, but simple cases might work.
    // For robustness, consider a dedicated date/time library or manual parsing.
    // As a simplification, assuming std::put_time and std::get_time equivalent.
    // For direct use with pqxx, it's often easier to convert time_t to string and vice-versa.
    // Let's use std::mktime for simplicity for now.

    std::tm t = {};
    std::string ts_str = f.as<std::string>();
    std::istringstream ss(ts_str);
    ss >> std::get_time(&t, "%Y-%m-%d %H:%M:%S"); // Assuming standard PostgreSQL timestamp format

    if (ss.fail()) {
        LOG_WARN("Failed to parse timestamp string: {}", ts_str);
        return std::chrono::system_clock::time_point();
    }
    return std::chrono::system_clock::from_time_t(std::mktime(&t));
}

#endif // OPTIDB_REPOSITORY_H
```