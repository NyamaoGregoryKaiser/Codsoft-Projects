```cpp
#ifndef OPTIDB_OPTIMIZATION_ENGINE_H
#define OPTIDB_OPTIMIZATION_ENGINE_H

#include <string>
#include <memory>
#include <vector>
#include <nlohmann/json.hpp>

#include "db/postgres_connection.h"
#include "services/target_db_service.h"
#include "models/target_db.h"
#include "models/query_metric.h"
#include "models/recommendation.h"
#include "utils/logger.h"
#include "common/exceptions.h"

// Forward declaration for actual repository (if needed, otherwise directly use db_conn_)
// For simplicity, we'll store recommendations directly here using db_conn_

class OptimizationEngine {
public:
    OptimizationEngine(std::shared_ptr<PostgresConnection> db_conn,
                       std::shared_ptr<TargetDbService> target_db_service);

    // Main analysis function
    std::vector<Recommendation> analyze_and_recommend(long target_db_id, long user_id);

    // Store a single recommendation
    void store_recommendation(const Recommendation& recommendation);

    // Get recommendations for a target DB
    std::vector<Recommendation> get_recommendations_for_target_db(long target_db_id, bool include_applied = false);

private:
    std::shared_ptr<PostgresConnection> db_conn_; // For OptiDB's own DB
    std::shared_ptr<TargetDbService> target_db_service_;

    // Helper to extract table and column names from a simple WHERE clause (basic example)
    std::vector<std::pair<std::string, std::string>> extract_potential_columns_from_query(const std::string& query);
    
    // Placeholder for a very basic index suggestion logic
    std::vector<Recommendation> suggest_indexes_for_slow_queries(const TargetDB& target_db, const std::vector<QueryMetric>& slow_queries);

    std::optional<Recommendation> map_row_to_recommendation(const pqxx::row& row);
};

#endif // OPTIDB_OPTIMIZATION_ENGINE_H
```