```cpp
#ifndef OPTIDB_QUERY_METRIC_H
#define OPTIDB_QUERY_METRIC_H

#include "base_model.h"
#include <string>
#include <nlohmann/json.hpp>

class QueryMetric : public BaseModel {
public:
    long target_db_id;
    std::string query_text;
    double total_time_ms;
    long calls;
    double mean_time_ms;
    double stddev_time_ms;
    long rows;
    std::string query_plan; // JSON or TEXT explain plan

    QueryMetric() = default;
    QueryMetric(long id, long target_db_id, const std::string& query_text, double total_time_ms, long calls,
                double mean_time_ms, double stddev_time_ms, long rows, const std::string& query_plan,
                std::chrono::system_clock::time_point created_at, std::chrono::system_clock::time_point updated_at)
        : target_db_id(target_db_id), query_text(query_text), total_time_ms(total_time_ms), calls(calls),
          mean_time_ms(mean_time_ms), stddev_time_ms(stddev_time_ms), rows(rows), query_plan(query_plan) {
        this->id = id;
        this->created_at = created_at;
        this->updated_at = updated_at;
    }

    nlohmann::json to_json() const override {
        nlohmann::json j;
        j["id"] = id;
        j["target_db_id"] = target_db_id;
        j["query_text"] = query_text;
        j["total_time_ms"] = total_time_ms;
        j["calls"] = calls;
        j["mean_time_ms"] = mean_time_ms;
        j["stddev_time_ms"] = stddev_time_ms;
        j["rows"] = rows;
        j["query_plan"] = query_plan;
        j["created_at"] = to_iso8601(created_at);
        j["updated_at"] = to_iso8601(updated_at);
        return j;
    }
};

#endif // OPTIDB_QUERY_METRIC_H
```