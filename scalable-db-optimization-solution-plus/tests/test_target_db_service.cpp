```cpp
#include "gtest/gtest.h"
#include "services/target_db_service.h"
#include "db/postgres_connection.h"
#include "models/target_db.h"
#include "common/exceptions.h"
#include "config/config.h"

#include <memory>
#include <pqxx/pqxx>

// Fixture for TargetDbService tests
class TargetDbServiceTest : public ::testing::Test {
protected:
    std::shared_ptr<PostgresConnection> db_conn;
    OptiDBConfig config;
    std::unique_ptr<TargetDbService> target_db_service;
    long test_user_id;

    void SetUp() override {
        config = get_test_config(); // Reusing from AuthServiceTest
        db_conn = std::make_shared<PostgresConnection>(config, 1);
        target_db_service = std::make_unique<TargetDbService>(db_conn, config);

        // Ensure clean state before each test
        auto conn_ptr = db_conn->get_connection();
        pqxx::work txn(*conn_ptr);
        txn.exec("DELETE FROM recommendations CASCADE;");
        txn.exec("DELETE FROM query_metrics CASCADE;");
        txn.exec("DELETE FROM target_databases CASCADE;");
        txn.exec("DELETE FROM users CASCADE;");

        // Create a test user for foreign key constraints
        pqxx::result r = txn.exec("INSERT INTO users (username, email, password_hash) VALUES ('testuser', 'test@user.com', 'hashedpass') RETURNING id;");
        txn.commit();
        test_user_id = r[0]["id"].as<long>();
        db_conn->release_connection(conn_ptr);
    }

    void TearDown() override {
        // Clean up after each test
        auto conn_ptr = db_conn->get_connection();
        pqxx::work txn(*conn_ptr);
        txn.exec("DELETE FROM recommendations CASCADE;");
        txn.exec("DELETE FROM query_metrics CASCADE;");
        txn.exec("DELETE FROM target_databases CASCADE;");
        txn.exec("DELETE FROM users CASCADE;");
        txn.commit();
        db_conn->release_connection(conn_ptr);
    }

    // Helper function to create a dummy target DB
    TargetDB create_dummy_target_db(long user_id, const std::string& name_suffix) {
        return target_db_service->create_target_db(
            user_id,
            "TargetDB_" + name_suffix,
            "localhost", "5432", "postgres", "postgres", "password" // Use dummy for target, real connection attempt will fail unless a real PG is running
        );
    }
};

TEST_F(TargetDbServiceTest, CreateTargetDbSuccess) {
    TargetDB db = create_dummy_target_db(test_user_id, "test1");
    ASSERT_GT(db.id, 0);
    ASSERT_EQ(db.name, "TargetDB_test1");
    ASSERT_EQ(db.user_id, test_user_id);
    // Note: The actual status for "postgres" db might be ERROR if not running or no permissions
    // ASSERT_EQ(db.status, TargetDBStatus::ERROR); // Assuming target db "postgres" is not available
}

TEST_F(TargetDbServiceTest, CreateTargetDbDuplicateNameFails) {
    create_dummy_target_db(test_user_id, "dup");
    ASSERT_THROW(create_dummy_target_db(test_user_id, "dup"), DatabaseException); // Unique constraint violation
}

TEST_F(TargetDbServiceTest, GetTargetDbByIdFound) {
    TargetDB db = create_dummy_target_db(test_user_id, "get1");
    auto fetched_db_opt = target_db_service->get_target_db_by_id(db.id, test_user_id);
    ASSERT_TRUE(fetched_db_opt.has_value());
    ASSERT_EQ(fetched_db_opt->id, db.id);
    ASSERT_EQ(fetched_db_opt->name, db.name);
}

TEST_F(TargetDbServiceTest, GetTargetDbByIdNotFound) {
    auto fetched_db_opt = target_db_service->get_target_db_by_id(99999, test_user_id);
    ASSERT_FALSE(fetched_db_opt.has_value());
}

TEST_F(TargetDbServiceTest, GetTargetDbByIdUnauthorized) {
    TargetDB db = create_dummy_target_db(test_user_id, "unauth");
    // Create another user
    auto conn_ptr = db_conn->get_connection();
    pqxx::work txn(*conn_ptr);
    pqxx::result r = txn.exec("INSERT INTO users (username, email, password_hash) VALUES ('otheruser', 'other@user.com', 'hashedpass') RETURNING id;");
    txn.commit();
    long other_user_id = r[0]["id"].as<long>();
    db_conn->release_connection(conn_ptr);

    auto fetched_db_opt = target_db_service->get_target_db_by_id(db.id, other_user_id);
    ASSERT_FALSE(fetched_db_opt.has_value());
}

TEST_F(TargetDbServiceTest, GetAllTargetDbs) {
    create_dummy_target_db(test_user_id, "all1");
    create_dummy_target_db(test_user_id, "all2");
    std::vector<TargetDB> dbs = target_db_service->get_all_target_dbs(test_user_id);
    ASSERT_EQ(dbs.size(), 2);
}

TEST_F(TargetDbServiceTest, UpdateTargetDbSuccess) {
    TargetDB db = create_dummy_target_db(test_user_id, "update1");
    TargetDB updated_db = target_db_service->update_target_db(
        db.id, test_user_id, "Updated Name", db.host, db.port,
        db.db_name, db.db_user, "new_password", TargetDBStatus::ACTIVE, "No error"
    );
    ASSERT_EQ(updated_db.name, "Updated Name");
    ASSERT_EQ(updated_db.status, TargetDBStatus::ACTIVE);

    auto fetched_db_opt = target_db_service->get_target_db_by_id(db.id, test_user_id);
    ASSERT_TRUE(fetched_db_opt.has_value());
    ASSERT_EQ(fetched_db_opt->name, "Updated Name");
}

TEST_F(TargetDbServiceTest, DeleteTargetDbSuccess) {
    TargetDB db = create_dummy_target_db(test_user_id, "delete1");
    target_db_service->delete_target_db(db.id, test_user_id);
    auto fetched_db_opt = target_db_service->get_target_db_by_id(db.id, test_user_id);
    ASSERT_FALSE(fetched_db_opt.has_value());
}

TEST_F(TargetDbServiceTest, DeleteTargetDbNotFound) {
    ASSERT_THROW(target_db_service->delete_target_db(99999, test_user_id), NotFoundException);
}

TEST_F(TargetDbServiceTest, TestTargetDbConnectionFailsIfTargetDBDown) {
    TargetDB db_down;
    db_down.host = "nonexistenthost";
    db_down.port = "5432";
    db_down.db_name = "testdb";
    db_down.db_user = "testuser";
    db_down.db_password_enc = target_db_service->encrypt_password("testpass");
    db_down.name = "Test DB Down";

    ASSERT_THROW(target_db_service->test_target_db_connection(db_down), DatabaseConnectionException);
}

// Mocking PostgreSQL for `get_slow_queries_from_target_db` and `get_query_plan_from_target_db`
// is complex as it involves `pqxx::connection` directly.
// For a full integration test, a real target PostgreSQL instance would be needed.
// These tests would likely be part of `test_api_integration.cpp` or a dedicated integration test suite.

// Example of how one might test `store_query_metric`
TEST_F(TargetDbServiceTest, StoreQueryMetricSuccess) {
    TargetDB target_db = create_dummy_target_db(test_user_id, "metrics_target");
    QueryMetric metric;
    metric.target_db_id = target_db.id;
    metric.query_text = "SELECT 1;";
    metric.total_time_ms = 10.5;
    metric.calls = 1;
    metric.mean_time_ms = 10.5;
    metric.stddev_time_ms = 0.0;
    metric.rows = 1;
    metric.query_plan = "dummy plan";
    metric.created_at = std::chrono::system_clock::now();
    metric.updated_at = metric.created_at;

    ASSERT_NO_THROW(target_db_service->store_query_metric(metric));

    // Verify it's stored
    std::vector<QueryMetric> fetched_metrics = target_db_service->get_query_metrics_for_target_db(target_db.id, 10);
    ASSERT_EQ(fetched_metrics.size(), 1);
    ASSERT_EQ(fetched_metrics[0].query_text, "SELECT 1;");
}

TEST_F(TargetDbServiceTest, GetQueryMetricsForTargetDb) {
    TargetDB target_db = create_dummy_target_db(test_user_id, "get_metrics_target");

    QueryMetric metric1;
    metric1.target_db_id = target_db.id; metric1.query_text = "Q1"; metric1.total_time_ms = 100; metric1.calls=10; metric1.mean_time_ms=10; metric1.stddev_time_ms=1; metric1.rows=100; metric1.query_plan="plan1";
    metric1.created_at = std::chrono::system_clock::now() - std::chrono::seconds(5);
    metric1.updated_at = metric1.created_at;
    target_db_service->store_query_metric(metric1);

    QueryMetric metric2;
    metric2.target_db_id = target_db.id; metric2.query_text = "Q2"; metric2.total_time_ms = 200; metric2.calls=20; metric2.mean_time_ms=10; metric2.stddev_time_ms=2; metric2.rows=200; metric2.query_plan="plan2";
    metric2.created_at = std::chrono::system_clock::now();
    metric2.updated_at = metric2.created_at;
    target_db_service->store_query_metric(metric2);

    std::vector<QueryMetric> fetched_metrics = target_db_service->get_query_metrics_for_target_db(target_db.id, 10);
    ASSERT_EQ(fetched_metrics.size(), 2);
    // Metrics should be ordered by created_at DESC
    ASSERT_EQ(fetched_metrics[0].query_text, "Q2");
    ASSERT_EQ(fetched_metrics[1].query_text, "Q1");
}

```