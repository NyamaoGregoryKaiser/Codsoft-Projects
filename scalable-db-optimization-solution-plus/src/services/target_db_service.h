```cpp
#ifndef OPTIDB_TARGET_DB_SERVICE_H
#define OPTIDB_TARGET_DB_SERVICE_H

#include <string>
#include <memory>
#include <vector>
#include <optional>
#include <pqxx/pqxx>
#include <nlohmann/json.hpp>

#include "db/postgres_connection.h"
#include "models/target_db.h"
#include "models/query_metric.h"
#include "utils/logger.h"
#include "common/exceptions.h"
#include "config/config.h" // For target_db_connection_timeout_ms

class TargetDbService {
public:
    TargetDbService(std::shared_ptr<PostgresConnection> db_conn, const OptiDBConfig& config);

    // CRUD for TargetDBs
    TargetDB create_target_db(long user_id, const std::string& name, const std::string& host, const std::string& port,
                              const std::string& db_name, const std::string& db_user, const std::string& db_password);
    std::optional<TargetDB> get_target_db_by_id(long target_db_id, long user_id);
    std::vector<TargetDB> get_all_target_dbs(long user_id);
    TargetDB update_target_db(long target_db_id, long user_id, const std::string& name, const std::string& host,
                              const std::string& port, const std::string& db_name, const std::string& db_user,
                              const std::string& db_password, TargetDBStatus status, const std::string& last_error);
    void delete_target_db(long target_db_id, long user_id);

    // Target DB specific operations
    void test_target_db_connection(const TargetDB& target_db);
    std::vector<QueryMetric> get_slow_queries_from_target_db(const TargetDB& target_db, int limit = 10, double min_total_time_ms = 0);
    std::string get_query_plan_from_target_db(const TargetDB& target_db, const std::string& query_text);
    void store_query_metric(const QueryMetric& metric);
    std::vector<QueryMetric> get_query_metrics_for_target_db(long target_db_id, int limit = 100);


private:
    std::shared_ptr<PostgresConnection> db_conn_; // For OptiDB's own DB
    const OptiDBConfig& config_; // For target DB connection config

    std::string encrypt_password(const std::string& password); // Placeholder
    std::string decrypt_password(const std::string& encrypted_password); // Placeholder

    std::optional<TargetDB> map_row_to_target_db(const pqxx::row& row);
};

#endif // OPTIDB_TARGET_DB_SERVICE_H
```