```cpp
#include <gtest/gtest.h>
#include "../../src/database/DatabaseManager.h"
#include "../../src/utils/Logger.h"
#include <fstream>
#include <pqxx/pqxx>

class DatabaseManagerTest : public ::testing::Test {
protected:
    void SetUp() override {
        Scraper::Utils::Logger::init("test_logger", "/dev/null");
        // Initialize DatabaseManager with a test database
        std::string test_db_url = "postgresql://user:password@localhost:5432/test_scraper_db";
        try {
            Scraper::Database::DatabaseManager::getInstance().initialize(test_db_url, 1);
            
            // Re-run init.sql to ensure a clean state for each test
            auto conn = Scraper::Database::ConnectionPool::getInstance().getConnection();
            pqxx::work txn(*conn);
            std::ifstream init_script("../../database/init.sql");
            std::string script_content((std::istreambuf_iterator<char>(init_script)), std::istreambuf_iterator<char>());
            txn.exec(script_content);
            txn.commit();
            Scraper::Database::ConnectionPool::getInstance().releaseConnection(std::move(conn));
        } catch (const std::exception& e) {
            FAIL() << "Failed to set up test database: " << e.what() << "\n"
                   << "Ensure PostgreSQL is running, 'test_scraper_db' exists, and 'user' has privileges.";
        }
    }

    void TearDown() override {
        // Database is cleaned up by SetUp for the next test by re-running init.sql.
        // No explicit teardown needed here other than letting connections close.
    }
};

// Test User CRUD operations
TEST_F(DatabaseManagerTest, UserCRUD) {
    Scraper::Database::DatabaseManager& db_manager = Scraper::Database::DatabaseManager::getInstance();
    
    // 1. Create User
    Scraper::Database::Models::User new_user;
    new_user.id = db_manager.generateUuid();
    new_user.username = "testuser_crud";
    new_user.email = "test_crud@example.com";
    new_user.password_hash = "hashedpassword";
    new_user.created_at = std::chrono::system_clock::now();
    new_user.updated_at = std::chrono::system_clock::now();

    std::optional<Scraper::Database::Models::User> created_user = db_manager.createUser(new_user);
    ASSERT_TRUE(created_user.has_value());
    ASSERT_EQ(created_user->username, new_user.username);
    ASSERT_EQ(created_user->email, new_user.email);
    ASSERT_EQ(created_user->password_hash, new_user.password_hash);

    // 2. Get User by Username
    std::optional<Scraper::Database::Models::User> fetched_user_by_name = db_manager.getUserByUsername(new_user.username);
    ASSERT_TRUE(fetched_user_by_name.has_value());
    ASSERT_EQ(fetched_user_by_name->id, new_user.id);

    // 3. Get User by ID
    std::optional<Scraper::Database::Models::User> fetched_user_by_id = db_manager.getUserById(new_user.id);
    ASSERT_TRUE(fetched_user_by_id.has_value());
    ASSERT_EQ(fetched_user_by_id->username, new_user.username);

    // Test non-existent user
    ASSERT_FALSE(db_manager.getUserByUsername("nonexistent").has_value());
    ASSERT_FALSE(db_manager.getUserById(db_manager.generateUuid()).has_value());
}

// Test ScrapingJob CRUD operations
TEST_F(DatabaseManagerTest, ScrapingJobCRUD) {
    Scraper::Database::DatabaseManager& db_manager = Scraper::Database::DatabaseManager::getInstance();

    // First, create a user to associate the job with
    Scraper::Database::Models::User owner_user;
    owner_user.id = db_manager.generateUuid();
    owner_user.username = "job_owner";
    owner_user.email = "job_owner@example.com";
    owner_user.password_hash = "hash";
    owner_user.created_at = std::chrono::system_clock::now();
    owner_user.updated_at = std::chrono::system_clock::now();
    db_manager.createUser(owner_user);

    // 1. Create Job
    Scraper::Database::Models::ScrapingJob new_job;
    new_job.id = db_manager.generateUuid();
    new_job.user_id = owner_user.id;
    new_job.name = "Test Job";
    new_job.target_url = "http://example.com";
    new_job.cron_schedule = "0 * * * *";
    new_job.css_selector = ".product-title";
    new_job.status = Scraper::Database::Models::JobStatus::PENDING;
    new_job.created_at = std::chrono::system_clock::now();
    new_job.updated_at = std::chrono::system_clock::now();

    std::optional<Scraper::Database::Models::ScrapingJob> created_job = db_manager.createJob(new_job);
    ASSERT_TRUE(created_job.has_value());
    ASSERT_EQ(created_job->name, new_job.name);
    ASSERT_EQ(created_job->user_id, owner_user.id);

    // 2. Get All Jobs for user
    std::vector<Scraper::Database::Models::ScrapingJob> jobs_for_user = db_manager.getAllJobs(owner_user.id);
    ASSERT_EQ(jobs_for_user.size(), 1);
    ASSERT_EQ(jobs_for_user[0].id, new_job.id);

    // 3. Get Job by ID
    std::optional<Scraper::Database::Models::ScrapingJob> fetched_job = db_manager.getJobById(new_job.id);
    ASSERT_TRUE(fetched_job.has_value());
    ASSERT_EQ(fetched_job->name, new_job.name);
    ASSERT_EQ(fetched_job->status, Scraper::Database::Models::JobStatus::PENDING);

    // 4. Update Job
    fetched_job->status = Scraper::Database::Models::JobStatus::RUNNING;
    fetched_job->last_run_message = "Starting run";
    fetched_job->last_run_at = std::chrono::system_clock::now();
    bool updated = db_manager.updateJob(*fetched_job);
    ASSERT_TRUE(updated);

    std::optional<Scraper::Database::Models::ScrapingJob> updated_job = db_manager.getJobById(new_job.id);
    ASSERT_TRUE(updated_job.has_value());
    ASSERT_EQ(updated_job->status, Scraper::Database::Models::JobStatus::RUNNING);
    ASSERT_EQ(*updated_job->last_run_message, "Starting run");
    ASSERT_TRUE(updated_job->last_run_at.has_value());

    // 5. Delete Job
    bool deleted = db_manager.deleteJob(new_job.id, owner_user.id);
    ASSERT_TRUE(deleted);
    ASSERT_FALSE(db_manager.getJobById(new_job.id).has_value());
    ASSERT_TRUE(db_manager.getAllJobs(owner_user.id).empty());
}

// Test ScrapedData CRUD operations
TEST_F(DatabaseManagerTest, ScrapedDataCRUD) {
    Scraper::Database::DatabaseManager& db_manager = Scraper::Database::DatabaseManager::getInstance();

    // First, create a user and a job
    Scraper::Database::Models::User owner_user;
    owner_user.id = db_manager.generateUuid();
    owner_user.username = "data_owner";
    owner_user.email = "data_owner@example.com";
    owner_user.password_hash = "hash";
    owner_user.created_at = std::chrono::system_clock::now();
    owner_user.updated_at = std::chrono::system_clock::now();
    db_manager.createUser(owner_user);

    Scraper::Database::Models::ScrapingJob parent_job;
    parent_job.id = db_manager.generateUuid();
    parent_job.user_id = owner_user.id;
    parent_job.name = "Data Test Job";
    parent_job.target_url = "http://example.com/data";
    parent_job.cron_schedule = "manual";
    parent_job.css_selector = ".data-item";
    parent_job.status = Scraper::Database::Models::JobStatus::COMPLETED;
    parent_job.created_at = std::chrono::system_clock::now();
    parent_job.updated_at = std::chrono::system_clock::now();
    db_manager.createJob(parent_job);

    // 1. Create Scraped Data
    Scraper::Database::Models::ScrapedData new_data1;
    new_data1.id = db_manager.generateUuid();
    new_data1.job_id = parent_job.id;
    new_data1.url = parent_job.target_url;
    new_data1.data = nlohmann::json{{"field1", "value1"}, {"field2", 123}};
    new_data1.scraped_at = std::chrono::system_clock::now() - std::chrono::minutes(5);

    std::optional<Scraper::Database::Models::ScrapedData> created_data1 = db_manager.createScrapedData(new_data1);
    ASSERT_TRUE(created_data1.has_value());
    ASSERT_EQ(created_data1->job_id, parent_job.id);
    ASSERT_EQ(created_data1->data["field1"], "value1");

    Scraper::Database::Models::ScrapedData new_data2;
    new_data2.id = db_manager.generateUuid();
    new_data2.job_id = parent_job.id;
    new_data2.url = parent_job.target_url;
    new_data2.data = nlohmann::json{{"fieldA", "valueA"}};
    new_data2.scraped_at = std::chrono::system_clock::now();

    std::optional<Scraper::Database::Models::ScrapedData> created_data2 = db_manager.createScrapedData(new_data2);
    ASSERT_TRUE(created_data2.has_value());

    // 2. Get Scraped Data for Job
    std::vector<Scraper::Database::Models::ScrapedData> data_for_job = db_manager.getScrapedDataForJob(parent_job.id);
    ASSERT_EQ(data_for_job.size(), 2);
    // Data should be sorted by scraped_at DESC (newest first)
    ASSERT_EQ(data_for_job[0].id, created_data2->id);
    ASSERT_EQ(data_for_job[1].id, created_data1->id);

    // 3. Get Scraped Data by ID
    std::optional<Scraper::Database::Models::ScrapedData> fetched_data_by_id = db_manager.getScrapedDataById(created_data1->id);
    ASSERT_TRUE(fetched_data_by_id.has_value());
    ASSERT_EQ(fetched_data_by_id->id, created_data1->id);
    ASSERT_EQ(fetched_data_by_id->data["field2"], 123);

    // Test non-existent data
    ASSERT_FALSE(db_manager.getScrapedDataById(db_manager.generateUuid()).has_value());
}
```