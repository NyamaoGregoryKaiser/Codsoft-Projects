```cpp
#ifndef PERFOMETRICS_METRICSERVICE_H
#define PERFOMETRICS_METRICSERVICE_H

#include "../db/DBManager.h"
#include "../models/Metric.h"
#include "../models/Service.h"
#include "../dto/MetricDTO.h"
#include "../utils/Logger.h"
#include <vector>
#include <string>
#include <chrono>
#include <optional>
#include <set> // For valid metric types

class MetricService {
public:
    MetricService();

    // Service Management
    ServiceResponseDTO create_service(const CreateServiceRequestDTO& request);
    std::optional<Service> get_service_by_api_key(const std::string& api_key);
    std::optional<Service> get_service_by_id(int service_id);
    std::vector<ServiceResponseDTO> get_all_services();

    // Metric Ingestion
    void ingest_metric(int service_id, const MetricIngestDTO& dto);
    void ingest_batch_metrics(int service_id, const BatchMetricIngestDTO& dto);

    // Metric Query
    std::vector<MetricResponseDTO> get_metrics_for_service(
        int service_id,
        const std::optional<std::string>& metric_type,
        const std::optional<std::chrono::system_clock::time_point>& start_time,
        const std::optional<std::chrono::system_clock::time_point>& end_time,
        int limit, int offset
    );

private:
    std::string generate_api_key();
    std::set<std::string> valid_metric_types;
    void validate_metric_type(const std::string& metric_type_str);
};

#endif //PERFOMETRICS_METRICSERVICE_H
```