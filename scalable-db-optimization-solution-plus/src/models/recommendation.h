```cpp
#ifndef OPTIDB_RECOMMENDATION_H
#define OPTIDB_RECOMMENDATION_H

#include "base_model.h"
#include <string>
#include <nlohmann/json.hpp>

enum class RecommendationType {
    INDEX_SUGGESTION,
    SCHEMA_CHANGE,
    QUERY_REWRITE,
    CONFIGURATION_TWEAK
};

inline std::string rec_type_to_string(RecommendationType type) {
    switch (type) {
        case RecommendationType::INDEX_SUGGESTION: return "INDEX_SUGGESTION";
        case RecommendationType::SCHEMA_CHANGE: return "SCHEMA_CHANGE";
        case RecommendationType::QUERY_REWRITE: return "QUERY_REWRITE";
        case RecommendationType::CONFIGURATION_TWEAK: return "CONFIGURATION_TWEAK";
        default: return "UNKNOWN";
    }
}

class Recommendation : public BaseModel {
public:
    long target_db_id;
    long query_metric_id; // Optional: Links to a specific query that triggered it
    RecommendationType type;
    std::string description;
    std::string suggestion_sql; // SQL statement for the recommendation (e.g., CREATE INDEX)
    std::string rationale;
    double estimated_impact_score; // e.g., 0-100
    bool applied;

    Recommendation() = default;
    Recommendation(long id, long target_db_id, long query_metric_id, RecommendationType type,
                   const std::string& description, const std::string& suggestion_sql,
                   const std::string& rationale, double estimated_impact_score, bool applied,
                   std::chrono::system_clock::time_point created_at, std::chrono::system_clock::time_point updated_at)
        : target_db_id(target_db_id), query_metric_id(query_metric_id), type(type), description(description),
          suggestion_sql(suggestion_sql), rationale(rationale), estimated_impact_score(estimated_impact_score),
          applied(applied) {
        this->id = id;
        this->created_at = created_at;
        this->updated_at = updated_at;
    }

    nlohmann::json to_json() const override {
        nlohmann::json j;
        j["id"] = id;
        j["target_db_id"] = target_db_id;
        j["query_metric_id"] = query_metric_id == 0 ? nullptr : query_metric_id; // Handle optional
        j["type"] = rec_type_to_string(type);
        j["description"] = description;
        j["suggestion_sql"] = suggestion_sql;
        j["rationale"] = rationale;
        j["estimated_impact_score"] = estimated_impact_score;
        j["applied"] = applied;
        j["created_at"] = to_iso8601(created_at);
        j["updated_at"] = to_iso8601(updated_at);
        return j;
    }
};

#endif // OPTIDB_RECOMMENDATION_H
```