```cpp
#include "optimization_engine.h"
#include "db/repository.h" // For parse_timestamp
#include <regex>

OptimizationEngine::OptimizationEngine(std::shared_ptr<PostgresConnection> db_conn,
                                       std::shared_ptr<TargetDbService> target_db_service)
    : db_conn_(db_conn), target_db_service_(target_db_service) {}

std::vector<Recommendation> OptimizationEngine::analyze_and_recommend(long target_db_id, long user_id) {
    auto target_db_opt = target_db_service_->get_target_db_by_id(target_db_id, user_id);
    if (!target_db_opt.has_value()) {
        throw NotFoundException("Target database not found or unauthorized for analysis.");
    }
    TargetDB target_db = target_db_opt.value();

    std::vector<Recommendation> generated_recommendations;

    // 1. Collect slow queries
    LOG_INFO("Collecting slow queries for target DB '{}' (ID: {}).", target_db.name, target_db.id);
    std::vector<QueryMetric> slow_queries;
    try {
        // Collect top 100 slow queries taking more than 100ms
        slow_queries = target_db_service_->get_slow_queries_from_target_db(target_db, 100, 100.0);
        for (auto& metric : slow_queries) {
            // Get detailed query plan for each slow query
            try {
                metric.query_plan = target_db_service_->get_query_plan_from_target_db(target_db, metric.query_text);
            } catch (const std::exception& e) {
                metric.query_plan = "Failed to retrieve plan: " + std::string(e.what());
                LOG_WARN("Failed to retrieve query plan for query from target DB {}: {}", target_db.id, e.what());
            }
            target_db_service_->store_query_metric(metric); // Store collected metrics in OptiDB's DB
        }
        LOG_INFO("Collected and stored {} slow queries.", slow_queries.size());
    } catch (const std::exception& e) {
        LOG_ERROR("Failed to collect slow queries for target DB '{}': {}", target_db.name, e.what());
        // Continue, but log the error. No recommendations from this step.
    }

    // 2. Generate recommendations based on collected data
    if (!slow_queries.empty()) {
        auto index_recs = suggest_indexes_for_slow_queries(target_db, slow_queries);
        generated_recommendations.insert(generated_recommendations.end(), index_recs.begin(), index_recs.end());
    }

    // Other types of analysis could go here:
    // - Schema analysis (e.g., missing foreign keys)
    // - Configuration analysis (e.g., shared_buffers, work_mem)
    // - Query rewrite suggestions

    // 3. Store new recommendations
    for (const auto& rec : generated_recommendations) {
        store_recommendation(rec);
    }

    LOG_INFO("Analysis for target DB '{}' (ID: {}) completed. Generated {} recommendations.",
             target_db.name, target_db.id, generated_recommendations.size());

    return generated_recommendations;
}

void OptimizationEngine::store_recommendation(const Recommendation& recommendation) {
    auto conn_ptr = db_conn_->get_connection();
    try {
        pqxx::work txn(*conn_ptr);
        txn.exec_params(
            "INSERT INTO recommendations (target_db_id, query_metric_id, type, description, suggestion_sql, rationale, estimated_impact_score, applied) "
            "VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
            recommendation.target_db_id, (recommendation.query_metric_id == 0 ? pqxx::nullvalue : recommendation.query_metric_id),
            rec_type_to_string(recommendation.type), recommendation.description, recommendation.suggestion_sql,
            recommendation.rationale, recommendation.estimated_impact_score, recommendation.applied
        );
        txn.commit();
        LOG_DEBUG("Stored recommendation for target_db_id {}: {}", recommendation.target_db_id, recommendation.description);
    } catch (const pqxx::sql_error& e) {
        LOG_ERROR("SQL Error storing recommendation for target_db_id {}: {}", recommendation.target_db_id, e.what());
        throw DatabaseException("Database error storing recommendation.");
    } catch (const std::exception& e) {
        LOG_ERROR("Error storing recommendation for target_db_id {}: {}", recommendation.target_db_id, e.what());
        throw;
    } finally {
        db_conn_->release_connection(conn_ptr);
    }
}

std::vector<Recommendation> OptimizationEngine::get_recommendations_for_target_db(long target_db_id, bool include_applied) {
    auto conn_ptr = db_conn_->get_connection();
    std::vector<Recommendation> recommendations;
    try {
        pqxx::work txn(*conn_ptr);
        std::string query_sql = "SELECT id, target_db_id, query_metric_id, type, description, suggestion_sql, rationale, estimated_impact_score, applied, created_at, updated_at "
                                "FROM recommendations WHERE target_db_id = $1";
        if (!include_applied) {
            query_sql += " AND applied = FALSE";
        }
        query_sql += " ORDER BY estimated_impact_score DESC, created_at DESC";

        pqxx::result r = txn.exec_params(query_sql, target_db_id);
        txn.commit();

        for (const auto& row : r) {
            recommendations.push_back(map_row_to_recommendation(row).value());
        }
    } catch (const pqxx::sql_error& e) {
        LOG_ERROR("SQL Error fetching recommendations for target DB {}: {}", target_db_id, e.what());
        throw DatabaseException("Database error fetching recommendations.");
    } catch (const std::exception& e) {
        LOG_ERROR("Error fetching recommendations for target DB {}: {}", target_db_id, e.what());
        throw;
    } finally {
        db_conn_->release_connection(conn_ptr);
    }
    return recommendations;
}

std::vector<std::pair<std::string, std::string>> OptimizationEngine::extract_potential_columns_from_query(const std::string& query) {
    std::vector<std::pair<std::string, std::string>> columns;
    // This is a very simplistic regex. A real parser would be much more complex.
    // It tries to find `FROM table_name WHERE column_name = ...` or `ORDER BY column_name`
    std::regex where_regex(R"(FROM\s+(\w+)\s+WHERE\s+(\w+)\s*[<=>!~]+\s*['"%\w\s]+)", std::regex_constants::icase);
    std::regex order_by_regex(R"(ORDER\s+BY\s+(\w+))", std::regex_constants::icase);

    std::smatch match;

    // WHERE clause extraction
    if (std::regex_search(query, match, where_regex)) {
        if (match.size() >= 3) { // 0: full match, 1: table, 2: column
            columns.push_back({match[1].str(), match[2].str()});
        }
    }

    // ORDER BY clause extraction
    if (std::regex_search(query, match, order_by_regex)) {
        if (match.size() >= 2) { // 0: full match, 1: column
            // We need to infer the table for ORDER BY if not explicitly aliased.
            // For simplicity, just add column with an empty table name, or infer from first FROM.
            std::string table_name = "unknown_table"; // Placeholder
            std::regex from_table_regex(R"(FROM\s+(\w+))", std::regex_constants::icase);
            std::smatch from_match;
            if (std::regex_search(query, from_match, from_table_regex)) {
                if (from_match.size() >= 2) {
                    table_name = from_match[1].str();
                }
            }
            columns.push_back({table_name, match[1].str()});
        }
    }
    
    // Remove duplicates
    std::sort(columns.begin(), columns.end());
    columns.erase(std::unique(columns.begin(), columns.end()), columns.end());

    return columns;
}

std::vector<Recommendation> OptimizationEngine::suggest_indexes_for_slow_queries(const TargetDB& target_db, const std::vector<QueryMetric>& slow_queries) {
    std::vector<Recommendation> suggestions;
    
    for (const auto& metric : slow_queries) {
        // Simple heuristic: if a query is slow and involves a WHERE clause, suggest an index.
        if (metric.total_time_ms > 500.0 && metric.calls > 10) { // If total time > 500ms and called > 10 times
            std::vector<std::pair<std::string, std::string>> candidate_columns = extract_potential_columns_from_query(metric.query_text);

            for (const auto& col_pair : candidate_columns) {
                if (col_pair.first != "unknown_table" && !col_pair.second.empty()) {
                    std::string index_name = "idx_" + col_pair.first + "_" + col_pair.second;
                    std::string suggestion_sql = "CREATE INDEX IF NOT EXISTS " + index_name + " ON " + col_pair.first + " (" + col_pair.second + ");";
                    std::string description = "Consider adding an index on table '" + col_pair.first + "' column '" + col_pair.second + "'";
                    std::string rationale = "Query '" + metric.query_text.substr(0, std::min((size_t)100, metric.query_text.length())) + "...' is performing slowly (mean_time: " + std::to_string(metric.mean_time_ms) + "ms, calls: " + std::to_string(metric.calls) + "). An index can significantly speed up lookups and ordering.";

                    // Check if an existing similar index already exists (this would require querying target DB schema)
                    // For now, simplify and suggest if found by heuristic. The "IF NOT EXISTS" in SQL helps.

                    suggestions.emplace_back(
                        0, // ID will be generated by DB
                        target_db.id,
                        metric.id, // Link to the specific metric
                        RecommendationType::INDEX_SUGGESTION,
                        description,
                        suggestion_sql,
                        rationale,
                        (metric.total_time_ms / metric.calls) * (metric.rows > 0 ? std::log(metric.rows) : 1.0) / 100.0, // Basic impact score
                        false, // Not yet applied
                        std::chrono::system_clock::now(),
                        std::chrono::system_clock::now()
                    );
                }
            }
        }
    }
    return suggestions;
}

std::optional<Recommendation> OptimizationEngine::map_row_to_recommendation(const pqxx::row& row) {
    try {
        long query_metric_id = row["query_metric_id"].is_null() ? 0 : row["query_metric_id"].as<long>();
        return Recommendation(
            row["id"].as<long>(),
            row["target_db_id"].as<long>(),
            query_metric_id,
            static_cast<RecommendationType>(row["type"].as<int>()), // Assuming enum conversion by int value from DB
            row["description"].as<std::string>(),
            row["suggestion_sql"].as<std::string>(),
            row["rationale"].as<std::string>(),
            row["estimated_impact_score"].as<double>(),
            row["applied"].as<bool>(),
            parse_timestamp(row["created_at"]),
            parse_timestamp(row["updated_at"])
        );
    } catch (const std::exception& e) {
        LOG_ERROR("Error mapping DB row to Recommendation model: {}", e.what());
        return std::nullopt;
    }
}

```