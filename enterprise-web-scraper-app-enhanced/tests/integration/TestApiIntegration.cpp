```cpp
#include <gtest/gtest.h>
#include "../../src/app.h"
#include "../../src/config/ConfigManager.h"
#include "../../src/database/DatabaseManager.h"
#include "../../src/utils/Logger.h"
#include <pistache/http.h>
#include <pistache/client.h>
#include <nlohmann/json.hpp>
#include <thread>
#include <chrono>
#include <fstream>

using namespace Pistache;
using namespace Pistache::Http;

// Global application instance for API tests
std::unique_ptr<Scraper::App> api_test_app;
Pistache::Http::Client http_client;
std::string base_url = "http://localhost:9080";
std::string test_jwt_token;
std::string test_user_id;

// Setup fixture for all API integration tests
class ApiIntegrationTest : public ::testing::Test {
protected:
    static void SetUpTestSuite() {
        Scraper::Utils::Logger::init("api_test_logger", "/dev/null"); // Mute logger for tests
        
        // Ensure config is loaded for API settings
        Scraper::Config::ConfigManager::getInstance().loadConfig("../../config/.env.example");
        
        // Initialize and start the application in a separate thread
        api_test_app = std::make_unique<Scraper::App>();
        std::thread app_thread([]{
            try {
                api_test_app->init();
                api_test_app->run(); // This will block until shutdown_requested_ is true
            } catch (const std::exception& e) {
                Scraper::Utils::Logger::get_logger()->critical("API Test App init/run failed: {}", e.what());
                FAIL() << "API Test App failed to start: " << e.what();
            }
        });
        app_thread.detach(); // Detach to let it run in background

        // Wait for the server to be ready
        http_client.init();
        auto request = http_client.get(base_url + "/health");
        bool server_ready = false;
        for (int i = 0; i < 20; ++i) { // Try for 20 seconds
            try {
                auto response = request.send().get();
                if (response.code() == Code::Ok) {
                    server_ready = true;
                    Scraper::Utils::Logger::get_logger()->info("API server is ready.");
                    break;
                }
            } catch (const std::exception& e) {
                // Ignore connection errors while waiting for server to start
            }
            std::this_thread::sleep_for(std::chrono::seconds(1));
        }
        ASSERT_TRUE(server_ready) << "API server did not start in time.";

        // Clean and seed the database for API tests
        std::string test_db_url = "postgresql://user:password@localhost:5432/test_scraper_db";
        Scraper::Database::DatabaseManager::getInstance().initialize(test_db_url, 1);
        auto conn = Scraper::Database::ConnectionPool::getInstance().getConnection();
        pqxx::work txn(*conn);
        std::ifstream init_script("../../database/init.sql");
        std::string script_content((std::istreambuf_iterator<char>(init_script)), std::istreambuf_iterator<char>());
        txn.exec(script_content);
        txn.commit();
        Scraper::Database::ConnectionPool::getInstance().releaseConnection(std::move(conn));
        
        // Register a test user and get a JWT token
        auto register_request = http_client.post(base_url + "/api/v1/auth/register");
        register_request.headers().add<Header::ContentType>(Mime::MediaType("application/json"));
        nlohmann::json user_data = {
            {"username", "api_test_user"},
            {"email", "api_test@example.com"},
            {"password", "password123"}
        };
        auto response = register_request.send(user_data.dump()).get();
        ASSERT_EQ(response.code(), Code::Created);
        nlohmann::json response_body = nlohmann::json::parse(response.body());
        test_jwt_token = response_body["token"].get<std::string>();
        
        // Get user ID from the database using username
        std::optional<Scraper::Database::Models::User> user_opt = Scraper::Database::DatabaseManager::getInstance().getUserByUsername("api_test_user");
        ASSERT_TRUE(user_opt.has_value());
        test_user_id = user_opt->id;

        ASSERT_FALSE(test_jwt_token.empty()) << "Failed to get JWT token for API tests.";
    }

    static void TearDownTestSuite() {
        if (api_test_app) {
            api_test_app->shutdown();
            // Give time for app to shut down gracefully
            std::this_thread::sleep_for(std::chrono::seconds(2));
        }
        http_client.shutdown();
        Scraper::Utils::Logger::get_logger()->info("API Integration Test Suite finished.");
    }
};

TEST_F(ApiIntegrationTest, HealthCheck) {
    auto request = http_client.get(base_url + "/health");
    auto response = request.send().get();
    ASSERT_EQ(response.code(), Code::Ok);
    ASSERT_EQ(response.body(), "{\"status\":\"UP\"}");
}

TEST_F(ApiIntegrationTest, Auth_RegisterAndLogin) {
    // Register another user
    auto register_request = http_client.post(base_url + "/api/v1/auth/register");
    register_request.headers().add<Header::ContentType>(Mime::MediaType("application/json"));
    nlohmann::json register_data = {
        {"username", "new_api_user"},
        {"email", "new_api@example.com"},
        {"password", "newpassword"}
    };
    auto register_response = register_request.send(register_data.dump()).get();
    ASSERT_EQ(register_response.code(), Code::Created);
    nlohmann::json register_body = nlohmann::json::parse(register_response.body());
    ASSERT_TRUE(register_body.contains("token"));
    
    // Login with the new user
    auto login_request = http_client.post(base_url + "/api/v1/auth/login");
    login_request.headers().add<Header::ContentType>(Mime::MediaType("application/json"));
    nlohmann::json login_data = {
        {"username", "new_api_user"},
        {"password", "newpassword"}
    };
    auto login_response = login_request.send(login_data.dump()).get();
    ASSERT_EQ(login_response.code(), Code::Ok);
    nlohmann::json login_body = nlohmann::json::parse(login_response.body());
    ASSERT_TRUE(login_body.contains("token"));
}

TEST_F(ApiIntegrationTest, Auth_LoginFail_InvalidCredentials) {
    auto login_request = http_client.post(base_url + "/api/v1/auth/login");
    login_request.headers().add<Header::ContentType>(Mime::MediaType("application/json"));
    nlohmann::json login_data = {
        {"username", "api_test_user"},
        {"password", "wrongpassword"}
    };
    auto login_response = login_request.send(login_data.dump()).get();
    ASSERT_EQ(login_response.code(), Code::Unauthorized);
    nlohmann::json error_body = nlohmann::json::parse(login_response.body());
    ASSERT_EQ(error_body["message"], "Invalid credentials.");
}

TEST_F(ApiIntegrationTest, JobCRUD_Success) {
    // 1. Create a job
    auto create_req = http_client.post(base_url + "/api/v1/jobs");
    create_req.headers().add<Header::Authorization>(Pistache::Http::Header::Authorization(test_jwt_token, "Bearer"));
    create_req.headers().add<Header::ContentType>(Mime::MediaType("application/json"));
    nlohmann::json job_data = {
        {"name", "Test Job via API"},
        {"target_url", "http://example.com/api-test"},
        {"cron_schedule", "manual"},
        {"css_selector", ".api-data"}
    };
    auto create_resp = create_req.send(job_data.dump()).get();
    ASSERT_EQ(create_resp.code(), Code::Created);
    nlohmann::json created_job_json = nlohmann::json::parse(create_resp.body());
    std::string job_id = created_job_json["id"].get<std::string>();
    ASSERT_EQ(created_job_json["name"], "Test Job via API");
    ASSERT_EQ(created_job_json["user_id"], test_user_id);

    // 2. Get all jobs
    auto get_all_req = http_client.get(base_url + "/api/v1/jobs");
    get_all_req.headers().add<Header::Authorization>(Pistache::Http::Header::Authorization(test_jwt_token, "Bearer"));
    auto get_all_resp = get_all_req.send().get();
    ASSERT_EQ(get_all_resp.code(), Code::Ok);
    nlohmann::json all_jobs_json = nlohmann::json::parse(get_all_resp.body());
    ASSERT_TRUE(all_jobs_json.is_array());
    ASSERT_FALSE(all_jobs_json.empty());
    bool found_new_job = false;
    for(const auto& job : all_jobs_json) {
        if (job["id"] == job_id) {
            found_new_job = true;
            break;
        }
    }
    ASSERT_TRUE(found_new_job);

    // 3. Get job by ID
    auto get_by_id_req = http_client.get(base_url + "/api/v1/jobs/" + job_id);
    get_by_id_req.headers().add<Header::Authorization>(Pistache::Http::Header::Authorization(test_jwt_token, "Bearer"));
    auto get_by_id_resp = get_by_id_req.send().get();
    ASSERT_EQ(get_by_id_resp.code(), Code::Ok);
    nlohmann::json fetched_job_json = nlohmann::json::parse(get_by_id_resp.body());
    ASSERT_EQ(fetched_job_json["id"], job_id);
    ASSERT_EQ(fetched_job_json["name"], "Test Job via API");

    // 4. Update job
    auto update_req = http_client.put(base_url + "/api/v1/jobs/" + job_id);
    update_req.headers().add<Header::Authorization>(Pistache::Http::Header::Authorization(test_jwt_token, "Bearer"));
    update_req.headers().add<Header::ContentType>(Mime::MediaType("application/json"));
    nlohmann::json update_data = {
        {"name", "Updated Test Job"},
        {"status", "COMPLETED"}
    };
    auto update_resp = update_req.send(update_data.dump()).get();
    ASSERT_EQ(update_resp.code(), Code::Ok);
    nlohmann::json updated_job_json = nlohmann::json::parse(update_resp.body());
    ASSERT_EQ(updated_job_json["name"], "Updated Test Job");
    ASSERT_EQ(updated_job_json["status"], "COMPLETED");

    // 5. Delete job
    auto delete_req = http_client.del(base_url + "/api/v1/jobs/" + job_id);
    delete_req.headers().add<Header::Authorization>(Pistache::Http::Header::Authorization(test_jwt_token, "Bearer"));
    auto delete_resp = delete_req.send().get();
    ASSERT_EQ(delete_resp.code(), Code::NoContent);

    // Verify deletion
    auto verify_delete_req = http_client.get(base_url + "/api/v1/jobs/" + job_id);
    verify_delete_req.headers().add<Header::Authorization>(Pistache::Http::Header::Authorization(test_jwt_token, "Bearer"));
    auto verify_delete_resp = verify_delete_req.send().get();
    ASSERT_EQ(verify_delete_resp.code(), Code::NotFound);
}

TEST_F(ApiIntegrationTest, JobAccess_Unauthorized) {
    // Try to access jobs without a token
    auto get_all_req = http_client.get(base_url + "/api/v1/jobs");
    auto get_all_resp = get_all_req.send().get();
    ASSERT_EQ(get_all_resp.code(), Code::Unauthorized);

    // Try with invalid token
    auto get_all_invalid_req = http_client.get(base_url + "/api/v1/jobs");
    get_all_invalid_req.headers().add<Header::Authorization>(Pistache::Http::Header::Authorization("invalidtoken", "Bearer"));
    auto get_all_invalid_resp = get_all_invalid_req.send().get();
    ASSERT_EQ(get_all_invalid_resp.code(), Code::Unauthorized);
}

TEST_F(ApiIntegrationTest, RunJob_TriggerAndDataFetch) {
    // 1. Create a manual job for triggering
    auto create_req = http_client.post(base_url + "/api/v1/jobs");
    create_req.headers().add<Header::Authorization>(Pistache::Http::Header::Authorization(test_jwt_token, "Bearer"));
    create_req.headers().add<Header::ContentType>(Mime::MediaType("application/json"));
    nlohmann::json job_data = {
        {"name", "Triggerable Job"},
        {"target_url", "http://example.com"}, // Using example.com to avoid network issues for demo
        {"cron_schedule", "manual"},
        {"css_selector", "title"} // Simple selector for mock parser
    };
    auto create_resp = create_req.send(job_data.dump()).get();
    ASSERT_EQ(create_resp.code(), Code::Created);
    nlohmann::json created_job_json = nlohmann::json::parse(create_resp.body());
    std::string job_id = created_job_json["id"].get<std::string>();

    // 2. Trigger the job
    auto run_req = http_client.post(base_url + "/api/v1/jobs/" + job_id + "/run");
    run_req.headers().add<Header::Authorization>(Pistache::Http::Header::Authorization(test_jwt_token, "Bearer"));
    auto run_resp = run_req.send().get();
    ASSERT_EQ(run_resp.code(), Code::Ok);
    ASSERT_EQ(nlohmann::json::parse(run_resp.body())["message"], "Scraping job triggered successfully.");

    // Give some time for the job to complete (as it runs in background thread)
    std::this_thread::sleep_for(std::chrono::seconds(5));

    // 3. Fetch scraped data for the job
    auto get_data_req = http_client.get(base_url + "/api/v1/data/" + job_id);
    get_data_req.headers().add<Header::Authorization>(Pistache::Http::Header::Authorization(test_jwt_token, "Bearer"));
    auto get_data_resp = get_data_req.send().get();
    ASSERT_EQ(get_data_resp.code(), Code::Ok);
    nlohmann::json scraped_data_json = nlohmann::json::parse(get_data_resp.body());
    ASSERT_TRUE(scraped_data_json.is_array());
    ASSERT_FALSE(scraped_data_json.empty());
    ASSERT_TRUE(scraped_data_json[0].contains("data"));
    ASSERT_EQ(scraped_data_json[0]["job_id"], job_id);

    // Get the specific data ID
    std::string data_id = scraped_data_json[0]["id"].get<std::string>();

    // 4. Fetch specific scraped data entry by ID
    auto get_specific_data_req = http_client.get(base_url + "/api/v1/data/" + job_id + "/" + data_id);
    get_specific_data_req.headers().add<Header::Authorization>(Pistache::Http::Header::Authorization(test_jwt_token, "Bearer"));
    auto get_specific_data_resp = get_specific_data_req.send().get();
    ASSERT_EQ(get_specific_data_resp.code(), Code::Ok);
    nlohmann::json specific_data_json = nlohmann::json::parse(get_specific_data_resp.body());
    ASSERT_EQ(specific_data_json["id"], data_id);
    ASSERT_EQ(specific_data_json["job_id"], job_id);

    // Cleanup
    auto delete_req = http_client.del(base_url + "/api/v1/jobs/" + job_id);
    delete_req.headers().add<Header::Authorization>(Pistache::Http::Header::Authorization(test_jwt_token, "Bearer"));
    delete_req.send().get();
}
```