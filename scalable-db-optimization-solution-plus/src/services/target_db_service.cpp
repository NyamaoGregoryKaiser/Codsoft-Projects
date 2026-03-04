```cpp
#include "target_db_service.h"
#include "db/repository.h" // For parse_timestamp
#include <cryptopp/aes.h> // Example: Crypto++ for encryption
#include <cryptopp/modes.h>
#include <cryptopp/filters.h>
#include <cryptopp/base64.h>
#include <cryptopp/osrng.h>

// Placeholder for encryption/decryption keys and IVs.
// In a real application, these would be managed securely (e.g., KMS, environment variables, hardware modules).
// For demonstration, using hardcoded values (NOT for production).
static const byte KEY[CryptoPP::AES::DEFAULT_KEYLENGTH] = {0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef, 0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef};
static const byte IV[CryptoPP::AES::BLOCKSIZE] = {0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef};

TargetDbService::TargetDbService(std::shared_ptr<PostgresConnection> db_conn, const OptiDBConfig& config)
    : db_conn_(db_conn), config_(config) {}

TargetDB TargetDbService::create_target_db(long user_id, const std::string& name, const std::string& host,
                                          const std::string& port, const std::string& db_name,
                                          const std::string& db_user, const std::string& db_password) {
    auto conn_ptr = db_conn_->get_connection();
    try {
        std::string encrypted_password = encrypt_password(db_password);
        
        // Test connection immediately upon creation
        TargetDB temp_target_db;
        temp_target_db.host = host;
        temp_target_db.port = port;
        temp_target_db.db_name = db_name;
        temp_target_db.db_user = db_user;
        temp_target_db.db_password_enc = encrypted_password; // Use encrypted password for consistency
        
        TargetDBStatus status = TargetDBStatus::ACTIVE;
        std::string last_error = "";
        try {
            test_target_db_connection(temp_target_db);
            LOG_INFO("Initial connection test for new target DB '{}' successful.", name);
        } catch (const DatabaseConnectionException& e) {
            status = TargetDBStatus::ERROR;
            last_error = e.what();
            LOG_ERROR("Initial connection test for new target DB '{}' failed: {}", name, e.what());
        }

        pqxx::work txn(*conn_ptr);
        pqxx::result r = txn.exec_params(
            "INSERT INTO target_databases (user_id, name, host, port, db_name, db_user, db_password_enc, status, last_error) "
            "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, created_at, updated_at",
            user_id, name, host, port, db_name, db_user, encrypted_password, target_db_status_to_string(status), last_error
        );
        txn.commit();

        if (r.empty()) {
            throw DatabaseException("Failed to create target database, no ID returned.");
        }

        long id = r[0]["id"].as<long>();
        auto created_at = parse_timestamp(r[0]["created_at"]);
        auto updated_at = parse_timestamp(r[0]["updated_at"]);

        LOG_INFO("Target DB '{}' created successfully with ID: {}. Status: {}", name, id, target_db_status_to_string(status));
        return TargetDB(id, user_id, name, host, port, db_name, db_user, encrypted_password, status, last_error, created_at, updated_at);

    } catch (const pqxx::sql_error& e) {
        LOG_ERROR("SQL Error during target DB creation: {}", e.what());
        throw DatabaseException("Database error during target DB creation.");
    } catch (const std::exception& e) {
        LOG_ERROR("Error during target DB creation: {}", e.what());
        throw;
    } finally {
        db_conn_->release_connection(conn_ptr);
    }
}

std::optional<TargetDB> TargetDbService::get_target_db_by_id(long target_db_id, long user_id) {
    auto conn_ptr = db_conn_->get_connection();
    try {
        pqxx::work txn(*conn_ptr);
        pqxx::result r = txn.exec_params(
            "SELECT id, user_id, name, host, port, db_name, db_user, db_password_enc, status, last_error, created_at, updated_at "
            "FROM target_databases WHERE id = $1 AND user_id = $2",
            target_db_id, user_id
        );
        txn.commit();

        if (r.empty()) {
            return std::nullopt;
        }
        return map_row_to_target_db(r[0]);
    } catch (const pqxx::sql_error& e) {
        LOG_ERROR("SQL Error fetching target DB by ID {}: {}", target_db_id, e.what());
        throw DatabaseException("Database error fetching target DB.");
    } catch (const std::exception& e) {
        LOG_ERROR("Error fetching target DB by ID {}: {}", target_db_id, e.what());
        throw;
    } finally {
        db_conn_->release_connection(conn_ptr);
    }
}

std::vector<TargetDB> TargetDbService::get_all_target_dbs(long user_id) {
    auto conn_ptr = db_conn_->get_connection();
    std::vector<TargetDB> dbs;
    try {
        pqxx::work txn(*conn_ptr);
        pqxx::result r = txn.exec_params(
            "SELECT id, user_id, name, host, port, db_name, db_user, db_password_enc, status, last_error, created_at, updated_at "
            "FROM target_databases WHERE user_id = $1 ORDER BY name",
            user_id
        );
        txn.commit();

        for (const auto& row : r) {
            dbs.push_back(map_row_to_target_db(row).value()); // Should always succeed if map_row_to_target_db is correct
        }
    } catch (const pqxx::sql_error& e) {
        LOG_ERROR("SQL Error fetching all target DBs for user {}: {}", user_id, e.what());
        throw DatabaseException("Database error fetching target DBs.");
    } catch (const std::exception& e) {
        LOG_ERROR("Error fetching all target DBs for user {}: {}", user_id, e.what());
        throw;
    } finally {
        db_conn_->release_connection(conn_ptr);
    }
    return dbs;
}

TargetDB TargetDbService::update_target_db(long target_db_id, long user_id, const std::string& name,
                                          const std::string& host, const std::string& port,
                                          const std::string& db_name, const std::string& db_user,
                                          const std::string& db_password, TargetDBStatus status, const std::string& last_error) {
    auto conn_ptr = db_conn_->get_connection();
    try {
        std::string encrypted_password = encrypt_password(db_password);

        pqxx::work txn(*conn_ptr);
        pqxx::result r = txn.exec_params(
            "UPDATE target_databases SET name=$1, host=$2, port=$3, db_name=$4, db_user=$5, db_password_enc=$6, "
            "status=$7, last_error=$8, updated_at=NOW() WHERE id=$9 AND user_id=$10 "
            "RETURNING id, user_id, name, host, port, db_name, db_user, db_password_enc, status, last_error, created_at, updated_at",
            name, host, port, db_name, db_user, encrypted_password, target_db_status_to_string(status), last_error,
            target_db_id, user_id
        );
        txn.commit();

        if (r.empty()) {
            throw NotFoundException("Target database not found or user unauthorized.");
        }
        LOG_INFO("Target DB '{}' (ID: {}) updated successfully.", name, target_db_id);
        return map_row_to_target_db(r[0]).value();

    } catch (const pqxx::sql_error& e) {
        LOG_ERROR("SQL Error updating target DB {}: {}", target_db_id, e.what());
        throw DatabaseException("Database error updating target DB.");
    } catch (const std::exception& e) {
        LOG_ERROR("Error updating target DB {}: {}", target_db_id, e.what());
        throw;
    } finally {
        db_conn_->release_connection(conn_ptr);
    }
}

void TargetDbService::delete_target_db(long target_db_id, long user_id) {
    auto conn_ptr = db_conn_->get_connection();
    try {
        pqxx::work txn(*conn_ptr);
        pqxx::result r = txn.exec_params(
            "DELETE FROM target_databases WHERE id=$1 AND user_id=$2",
            target_db_id, user_id
        );
        txn.commit();
        if (r.affected_rows() == 0) {
            throw NotFoundException("Target database not found or user unauthorized.");
        }
        LOG_INFO("Target DB (ID: {}) deleted successfully.", target_db_id);
    } catch (const pqxx::sql_error& e) {
        LOG_ERROR("SQL Error deleting target DB {}: {}", target_db_id, e.what());
        throw DatabaseException("Database error deleting target DB.");
    } catch (const std::exception& e) {
        LOG_ERROR("Error deleting target DB {}: {}", target_db_id, e.what());
        throw;
    } finally {
        db_conn_->release_connection(conn_ptr);
    }
}

void TargetDbService::test_target_db_connection(const TargetDB& target_db) {
    std::string decrypted_password = decrypt_password(target_db.db_password_enc);
    auto target_conn = PostgresConnection::create_target_db_connection(
        target_db.host, target_db.port, target_db.db_name,
        target_db.db_user, decrypted_password, config_.target_db_connection_timeout_ms
    );
    // If connection creation succeeded, it's considered a successful test.
    // The shared_ptr will automatically close the connection when it goes out of scope.
    LOG_INFO("Connection test to target DB '{}' successful.", target_db.name);
}

std::vector<QueryMetric> TargetDbService::get_slow_queries_from_target_db(const TargetDB& target_db, int limit, double min_total_time_ms) {
    std::string decrypted_password = decrypt_password(target_db.db_password_enc);
    auto target_conn = PostgresConnection::create_target_db_connection(
        target_db.host, target_db.port, target_db.db_name,
        target_db.db_user, decrypted_password, config_.target_db_connection_timeout_ms
    );

    std::vector<QueryMetric> metrics;
    try {
        pqxx::nontransaction N(*target_conn); // Use nontransaction for read-only
        // Requires pg_stat_statements to be enabled in target DB's postgresql.conf
        // and CREATE EXTENSION pg_stat_statements; to be run.
        pqxx::result r = N.exec_params(
            "SELECT query, total_time, calls, mean_time, stddev_time, rows, "
            "       LEFT(query, 100) as truncated_query " // Add a truncated query for logging
            "FROM pg_stat_statements "
            "WHERE total_time >= $1 " // Filter by minimum total execution time
            "ORDER BY total_time DESC LIMIT $2",
            min_total_time_ms, limit
        );

        for (const auto& row : r) {
            QueryMetric metric;
            metric.target_db_id = target_db.id;
            metric.query_text = row["query"].as<std::string>();
            metric.total_time_ms = row["total_time"].as<double>();
            metric.calls = row["calls"].as<long>();
            metric.mean_time_ms = row["mean_time"].as<double>();
            metric.stddev_time_ms = row["stddev_time"].as<double>();
            metric.rows = row["rows"].as<long>();
            metric.query_plan = "N/A (collect separately)"; // Will be collected by get_query_plan_from_target_db
            metric.created_at = std::chrono::system_clock::now(); // Timestamp when collected
            metric.updated_at = metric.created_at;
            metrics.push_back(metric);
        }
        LOG_INFO("Collected {} slow queries from target DB '{}'.", metrics.size(), target_db.name);
    } catch (const pqxx::sql_error& e) {
        LOG_ERROR("SQL Error collecting slow queries from target DB '{}': {}", target_db.name, e.what());
        if (std::string(e.what()).find("pg_stat_statements") != std::string::npos) {
            throw DatabaseException("pg_stat_statements extension might not be enabled or installed on target DB. Error: " + std::string(e.what()));
        }
        throw DatabaseException("Error collecting slow queries from target DB.");
    } catch (const std::exception& e) {
        LOG_ERROR("Error collecting slow queries from target DB '{}': {}", target_db.name, e.what());
        throw;
    }
    return metrics;
}

std::string TargetDbService::get_query_plan_from_target_db(const TargetDB& target_db, const std::string& query_text) {
    std::string decrypted_password = decrypt_password(target_db.db_password_enc);
    auto target_conn = PostgresConnection::create_target_db_connection(
        target_db.host, target_db.port, target_db.db_name,
        target_db.db_user, decrypted_password, config_.target_db_connection_timeout_ms
    );

    std::string query_plan_json = "";
    try {
        pqxx::nontransaction N(*target_conn);
        // Use 'EXPLAIN (ANALYZE, VERBOSE, FORMAT JSON)' for detailed JSON output
        pqxx::result r = N.exec("EXPLAIN (ANALYZE, VERBOSE, FORMAT JSON) " + query_text);
        
        // The result will typically be a single row, single column result, containing the JSON array.
        for (const auto& row : r) {
            query_plan_json += row[0].as<std::string>();
        }
        LOG_INFO("Collected query plan for query from target DB '{}'. Query snippet: {}", target_db.name, query_text.substr(0, std::min((size_t)100, query_text.length())));
    } catch (const pqxx::sql_error& e) {
        LOG_ERROR("SQL Error getting query plan for target DB '{}' and query '{}': {}", target_db.name, query_text.substr(0, std::min((size_t)100, query_text.length())), e.what());
        throw DatabaseException("Error getting query plan from target DB.");
    } catch (const std::exception& e) {
        LOG_ERROR("Error getting query plan for target DB '{}' and query '{}': {}", target_db.name, query_text.substr(0, std::min((size_t)100, query_text.length())), e.what());
        throw;
    }
    return query_plan_json;
}

void TargetDbService::store_query_metric(const QueryMetric& metric) {
    auto conn_ptr = db_conn_->get_connection();
    try {
        pqxx::work txn(*conn_ptr);
        txn.exec_params(
            "INSERT INTO query_metrics (target_db_id, query_text, total_time_ms, calls, mean_time_ms, stddev_time_ms, rows_returned, query_plan) "
            "VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
            metric.target_db_id, metric.query_text, metric.total_time_ms, metric.calls,
            metric.mean_time_ms, metric.stddev_time_ms, metric.rows, metric.query_plan
        );
        txn.commit();
        LOG_DEBUG("Stored query metric for target_db_id {} and query snippet: {}", metric.target_db_id, metric.query_text.substr(0, std::min((size_t)50, metric.query_text.length())));
    } catch (const pqxx::sql_error& e) {
        LOG_ERROR("SQL Error storing query metric for target_db_id {}: {}", metric.target_db_id, e.what());
        throw DatabaseException("Database error storing query metric.");
    } catch (const std::exception& e) {
        LOG_ERROR("Error storing query metric for target_db_id {}: {}", metric.target_db_id, e.what());
        throw;
    } finally {
        db_conn_->release_connection(conn_ptr);
    }
}

std::vector<QueryMetric> TargetDbService::get_query_metrics_for_target_db(long target_db_id, int limit) {
    auto conn_ptr = db_conn_->get_connection();
    std::vector<QueryMetric> metrics;
    try {
        pqxx::work txn(*conn_ptr);
        pqxx::result r = txn.exec_params(
            "SELECT id, target_db_id, query_text, total_time_ms, calls, mean_time_ms, stddev_time_ms, rows_returned, query_plan, created_at, updated_at "
            "FROM query_metrics WHERE target_db_id = $1 ORDER BY created_at DESC LIMIT $2",
            target_db_id, limit
        );
        txn.commit();

        for (const auto& row : r) {
            metrics.emplace_back(
                row["id"].as<long>(),
                row["target_db_id"].as<long>(),
                row["query_text"].as<std::string>(),
                row["total_time_ms"].as<double>(),
                row["calls"].as<long>(),
                row["mean_time_ms"].as<double>(),
                row["stddev_time_ms"].as<double>(),
                row["rows_returned"].as<long>(),
                row["query_plan"].as<std::string>(),
                parse_timestamp(row["created_at"]),
                parse_timestamp(row["updated_at"])
            );
        }
    } catch (const pqxx::sql_error& e) {
        LOG_ERROR("SQL Error fetching query metrics for target DB {}: {}", target_db_id, e.what());
        throw DatabaseException("Database error fetching query metrics.");
    } catch (const std::exception& e) {
        LOG_ERROR("Error fetching query metrics for target DB {}: {}", target_db_id, e.what());
        throw;
    } finally {
        db_conn_->release_connection(conn_ptr);
    }
    return metrics;
}


// --- Placeholder Encryption/Decryption ---
// These functions are critical and need robust, production-grade implementation.
// Current implementation uses Crypto++ for illustrative purposes but lacks proper key management,
// IV handling per encryption, and authenticated encryption (e.g., GCM mode).
std::string TargetDbService::encrypt_password(const std::string& password) {
    if (password.empty()) return "";

    std::string ciphertext;
    try {
        CryptoPP::AES::Encryption aesEncryption(KEY, sizeof(KEY));
        CryptoPP::CBC_Mode_ExternalCipher::Encryption cbcEncryption(aesEncryption, IV);

        CryptoPP::StreamTransformationFilter stfEncryptor(cbcEncryption,
            new CryptoPP::Base64Encoder(
                new CryptoPP::StringSink(ciphertext),
                false // No Line Breaks
            )
        );
        stfEncryptor.Put(reinterpret_cast<const byte*>(password.data()), password.size());
        stfEncryptor.MessageEnd();
    } catch (const CryptoPP::Exception& e) {
        LOG_ERROR("Crypto++ Encryption Error: {}", e.what());
        throw;
    }
    return ciphertext;
}

std::string TargetDbService::decrypt_password(const std::string& encrypted_password) {
    if (encrypted_password.empty()) return "";

    std::string decryptedtext;
    try {
        CryptoPP::AES::Decryption aesDecryption(KEY, sizeof(KEY));
        CryptoPP::CBC_Mode_ExternalCipher::Decryption cbcDecryption(aesDecryption, IV);

        CryptoPP::Base64Decoder base64Decoder;
        base64Decoder.Put(reinterpret_cast<const byte*>(encrypted_password.data()), encrypted_password.size());
        base64Decoder.MessageEnd();

        CryptoPP::StreamTransformationFilter stfDecryptor(cbcDecryption,
            new CryptoPP::StringSink(decryptedtext)
        );
        base64Decoder.Attach(new CryptoPP::Redirector(stfDecryptor));
        base64Decoder.MessageEnd();

        // stfDecryptor.Put(reinterpret_cast<const byte*>(encrypted_password.data()), encrypted_password.size());
        // stfDecryptor.MessageEnd();
    } catch (const CryptoPP::Exception& e) {
        LOG_ERROR("Crypto++ Decryption Error: {}", e.what());
        // In a real system, you might not re-throw if it's a known bad input, but log extensively.
        throw DatabaseException("Failed to decrypt database password. Potential corruption or incorrect key.");
    }
    return decryptedtext;
}

std::optional<TargetDB> TargetDbService::map_row_to_target_db(const pqxx::row& row) {
    try {
        return TargetDB(
            row["id"].as<long>(),
            row["user_id"].as<long>(),
            row["name"].as<std::string>(),
            row["host"].as<std::string>(),
            row["port"].as<std::string>(),
            row["db_name"].as<std::string>(),
            row["db_user"].as<std::string>(),
            row["db_password_enc"].as<std::string>(),
            string_to_target_db_status(row["status"].as<std::string>()),
            row["last_error"].as<std::string>(),
            parse_timestamp(row["created_at"]),
            parse_timestamp(row["updated_at"])
        );
    } catch (const std::exception& e) {
        LOG_ERROR("Error mapping DB row to TargetDB model: {}", e.what());
        return std::nullopt;
    }
}
```