```cpp
#include <gtest/gtest.h>
#include <gmock/gmock.h>
#include "../../src/scraping/Scraper.h"
#include "../../src/scraping/HttpFetcher.h"
#include "../../src/scraping/HtmlParser.h"
#include "../../src/database/DatabaseManager.h"
#include "../../src/utils/Logger.h"
#include <fstream>

using namespace ::testing;
using namespace Scraper::Scraping;
using namespace Scraper::Database::Models;

// Mock HttpFetcher and HtmlParser for isolated Scraper testing
class MockHttpFetcher : public HttpFetcher {
public:
    MOCK_METHOD(std::string, fetch, (const std::string& url), (override));
};

class MockHtmlParser : public HtmlParser {
public:
    MOCK_METHOD(nlohmann::json, parseAndExtract, (const std::string& html_content, const std::string& css_selector), (override));
};

class ScraperTest : public ::testing::Test {
protected:
    void SetUp() override {
        Scraper::Utils::Logger::init("test_logger", "/dev/null"); // Mute logger
        // Set up a clean test database for each test, similar to DatabaseManagerTest
        std::string test_db_url = "postgresql://user:password@localhost:5432/test_scraper_db";
        try {
            Scraper::Database::DatabaseManager::getInstance().initialize(test_db_url, 1);
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

    // Since Scraper internally creates HttpFetcher and HtmlParser,
    // we need to inject mocks or use dependency injection.
    // For this example, we'll demonstrate using a "real" scraper but with controlled scenarios.
    // A more advanced test would involve mocking `DatabaseManager` as well.
};

// This test uses the actual HttpFetcher/HtmlParser with controlled outputs (if possible)
// or focuses on interaction with DatabaseManager.
TEST_F(ScraperTest, RunJobSuccess) {
    Scraper scraper; // Uses real HttpFetcher and HtmlParser

    Scraper::Database::DatabaseManager& db_manager = Scraper::Database::DatabaseManager::getInstance();

    // Create a dummy user and job in the database
    User owner_user;
    owner_user.id = db_manager.generateUuid();
    owner_user.username = "scraper_user";
    owner_user.email = "scraper@example.com";
    owner_user.password_hash = "hash";
    owner_user.created_at = std::chrono::system_clock::now();
    owner_user.updated_at = std::chrono::system_clock::now();
    db_manager.createUser(owner_user);

    ScrapingJob job;
    job.id = db_manager.generateUuid();
    job.user_id = owner_user.id;
    job.name = "Test Scrape Job";
    job.target_url = "http://mock-example.com/product/123";
    job.cron_schedule = "manual";
    job.css_selector = "h1.title, .price";
    job.status = JobStatus::PENDING;
    job.created_at = std::chrono::system_clock::now();
    job.updated_at = std::chrono::system_clock::now();
    db_manager.createJob(job); // Persist initial job state

    // Simulating HttpFetcher behavior for a known URL (cannot mock directly here)
    // To properly unit test Scraper, you'd need to inject mocks.
    // For this example, we're relying on the `HtmlParser` mock behavior to handle fetch results.
    // This makes it more of an integration test for Scraper+DB.

    // A real mock injection would look something like this, but needs refactoring Scraper:
    // Scraper scraper(std::make_unique<MockHttpFetcher>(), std::make_unique<MockHtmlParser>());
    // EXPECT_CALL(*static_cast<MockHttpFetcher*>(scraper.getHttpFetcher()), fetch(job.target_url))
    //     .WillOnce(Return("<html><h1 class='title'>Product Name</h1><span class='price'>$10.00</span></html>"));
    // EXPECT_CALL(*static_cast<MockHtmlParser*>(scraper.getHtmlParser()), parseAndExtract(_, _))
    //     .WillOnce(Return(nlohmann::json{{"title", "Product Name"}, {"price", "$10.00"}}));

    // For the current design, we'll rely on our mock HtmlParser logic
    // which returns *some* data for *any* input.

    std::optional<ScrapedData> result = scraper.runJob(job); // Pass by value or mutable reference
    ASSERT_TRUE(result.has_value());
    ASSERT_EQ(result->job_id, job.id);
    ASSERT_FALSE(result->data.empty());
    
    // Verify job status updated in DB
    std::optional<ScrapingJob> updated_job = db_manager.getJobById(job.id);
    ASSERT_TRUE(updated_job.has_value());
    ASSERT_EQ(updated_job->status, JobStatus::COMPLETED);
    ASSERT_TRUE(updated_job->last_run_at.has_value());
    ASSERT_FALSE(updated_job->last_run_message->empty());
}

TEST_F(ScraperTest, RunJobFails_HttpError) {
    Scraper scraper;
    Scraper::Database::DatabaseManager& db_manager = Scraper::Database::DatabaseManager::getInstance();

    User owner_user;
    owner_user.id = db_manager.generateUuid();
    owner_user.username = "scraper_fail_user";
    owner_user.email = "scraper_fail@example.com";
    owner_user.password_hash = "hash";
    owner_user.created_at = std::chrono::system_clock::now();
    owner_user.updated_at = std::chrono::system_clock::now();
    db_manager.createUser(owner_user);

    ScrapingJob job;
    job.id = db_manager.generateUuid();
    job.user_id = owner_user.id;
    job.name = "Failing Scrape Job";
    // Use a known invalid URL to trigger HTTP fetch error
    job.target_url = "http://non-existent-domain-12345.com"; // This will definitely fail to fetch
    job.cron_schedule = "manual";
    job.css_selector = "h1";
    job.status = JobStatus::PENDING;
    job.created_at = std::chrono::system_clock::now();
    job.updated_at = std::chrono::system_clock::now();
    db_manager.createJob(job);

    // Expect an exception from runJob due to HTTP fetch error
    ASSERT_THROW(scraper.runJob(job), Scraper::Utils::ScrapingException);

    // Verify job status updated to FAILED in DB
    std::optional<ScrapingJob> failed_job = db_manager.getJobById(job.id);
    ASSERT_TRUE(failed_job.has_value());
    ASSERT_EQ(failed_job->status, JobStatus::FAILED);
    ASSERT_TRUE(failed_job->last_run_at.has_value());
    ASSERT_FALSE(failed_job->last_run_message->empty());
    ASSERT_THAT(*failed_job->last_run_message, HasSubstr("Failed to fetch URL"));
}
```