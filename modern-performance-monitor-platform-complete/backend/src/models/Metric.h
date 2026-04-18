```cpp
#ifndef PERFOMETRICS_METRIC_H
#define PERFOMETRICS_METRIC_H

#include <string>
#include <chrono>
#include <map>
#include "nlohmann/json.hpp" // For JSONB tags

enum MetricType {
    CPU_USAGE,
    MEMORY_USAGE,
    REQUEST_LATENCY,
    ERROR_RATE,
    CUSTOM_METRIC
};

// Helper to convert string to MetricType
MetricType string_to_metric_type(const std::string& s);
std::string metric_type_to_string(MetricType type);

struct Metric {
    long id;
    int service_id;
    std::chrono::system_clock::time_point timestamp;
    MetricType metric_type;
    double value;
    nlohmann::json tags; // For arbitrary key-value pairs (JSONB in DB)

    Metric() : id(0), service_id(0), value(0.0) {} // Default constructor
};

#endif //PERFOMETRICS_METRIC_H
```