```cpp
#include "Metric.h"
#include <stdexcept>

MetricType string_to_metric_type(const std::string& s) {
    if (s == "CPU_USAGE") return CPU_USAGE;
    if (s == "MEMORY_USAGE") return MEMORY_USAGE;
    if (s == "REQUEST_LATENCY") return REQUEST_LATENCY;
    if (s == "ERROR_RATE") return ERROR_RATE;
    if (s == "CUSTOM_METRIC") return CUSTOM_METRIC;
    throw std::invalid_argument("Invalid MetricType string: " + s);
}

std::string metric_type_to_string(MetricType type) {
    switch (type) {
        case CPU_USAGE: return "CPU_USAGE";
        case MEMORY_USAGE: return "MEMORY_USAGE";
        case REQUEST_LATENCY: return "REQUEST_LATENCY";
        case ERROR_RATE: return "ERROR_RATE";
        case CUSTOM_METRIC: return "CUSTOM_METRIC";
        default: return "UNKNOWN";
    }
}
```