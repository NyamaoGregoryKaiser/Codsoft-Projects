```cpp
#ifndef PERFOMETRICS_METRICDTO_H
#define PERFOMETRICS_METRICDTO_H

#include <string>
#include <vector>
#include "nlohmann/json.hpp"
#include "../models/Metric.h"

// Request DTO for ingesting a single metric
struct MetricIngestDTO {
    std::string metric_type;
    double value;
    // timestamp and service_id are usually set by the server or derived from auth
    nlohmann::json tags; // Optional additional tags

    NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(MetricIngestDTO, metric_type, value, tags)
};

// Request DTO for ingesting multiple metrics (batch)
struct BatchMetricIngestDTO {
    std::vector<MetricIngestDTO> metrics;

    NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(BatchMetricIngestDTO, metrics)
};

// Response DTO for a single metric query
struct MetricResponseDTO {
    long id;
    int service_id;
    std::string timestamp; // ISO 8601 string
    std::string metric_type;
    double value;
    nlohmann::json tags;

    NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(MetricResponseDTO, id, service_id, timestamp, metric_type, value, tags)
};

// Response DTO for service creation
struct ServiceResponseDTO {
    int id;
    std::string name;
    std::string description;
    std::string api_key; // Returned only on creation

    NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(ServiceResponseDTO, id, name, description, api_key)
};

// Request DTO for service creation
struct CreateServiceRequestDTO {
    std::string name;
    std::string description;

    NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(CreateServiceRequestDTO, name, description)
};

#endif //PERFOMETRICS_METRICDTO_H
```