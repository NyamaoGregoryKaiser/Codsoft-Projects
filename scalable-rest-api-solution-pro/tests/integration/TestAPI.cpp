```cpp
#include <gtest/gtest.h>
#include "app/App.h"
#include "core/utils/Config.h"
#include "core/utils/Logger.h"
#include "core/database/DatabaseManager.h"
#include "app/services/AuthService.h" // To hash password for seeding
#include <pistache/http.h>
#include <pistache/client.h>
#include <nlohmann/json.hpp>
#include <thread>
#include <future>
#include <chrono>

using namespace Pistache;
using namespace nlohmann;

// A simple in-memory cache for API tests to avoid re-registering/logging in
namespace TestCache {
    std::string test_user_token;
    long long test_user_id = 0;
    long long test_project_id = 0;
    long long test_task_id = 0;
}

class APIIntegrationTest : public ::testing::Test {
protected:
    std::unique_ptr<App> server_app;
    std::unique_ptr<Http::Client> client;
    static const std::string BASE_URL;
    static const std::string JWT_SECRET_TEST;
    static const std::string JWT_ISSUER_TEST;

    // Use a unique port for the API server for tests
    static const int API_TEST_PORT = 9081;

    // This runs once for the entire test suite
    static void SetUpTestSuite() {
        Config::load("config.json"); // Load a dummy or actual config
        Logger::init(Config::get("log_config_path", "config/log_config.json"));
        DatabaseManager::init("sqlite3::memory:"); // Use in-memory DB for tests
        
        // Manually apply schema migrations for in-memory DB
        // This is a minimal set required for core functionality.
        DatabaseManager::execute(
            "CREATE TABLE users ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT, username VARCHAR(255) NOT NULL UNIQUE, "
            "email VARCHAR(255) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, "
            "created_at TEXT, updated_at TEXT);"
        );
        DatabaseManager::execute(
            "CREATE TABLE projects ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(255) NOT NULL, "
            "description TEXT, owner_id INTEGER NOT NULL, "
            "created_at TEXT, updated_at TEXT, "
            "FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE);"
        );
        DatabaseManager::execute(
            "CREATE TABLE tasks ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT, title VARCHAR(255) NOT NULL, "
            "description TEXT, project_id INTEGER NOT NULL, assigned_user_id INTEGER NOT NULL, "
            "status VARCHAR(50) NOT NULL DEFAULT 'OPEN', due_date TEXT, "
            "created_at TEXT, updated_at TEXT, "
            "FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE, "
            "FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE CASCADE);"
        );

        // Initialize JWTManager for tests
        JWTManager::init(JWT_SECRET_TEST, JWT_ISSUER_TEST, 5); // 5 minutes expiry for tests

        // Start the server in a separate thread
        static std::thread server_thread;
        if (!server_thread.joinable()) {
            server_thread = std::thread([]() {
                try {
                    App app("127.0.0.1", API_TEST_PORT);
                    app.start();
                } catch (const std::exception& e) {
                    Logger::critical("Test API server failed to start: {}", e.what());
                }
            });
            // Give server a moment to start up
            std::this_thread::sleep_for(std::chrono::seconds(2));
        }
    }

    // This runs once after all tests in the suite have completed
    static void TearDownTestSuite() {
        // In a real scenario, you'd want to explicitly shut down the App
        // and join the thread. Pistache's App::start() is blocking.
        // For testing, `std::async` or `Pistache::Http::Endpoint::shutdown()`
        // would be needed. For this scope, the server thread will
        // typically terminate with the test runner process.
    }

    void SetUp() override {
        client = std::make_unique<Http::Client>();
        auto opts = Http::Client::options().threads(1).keepAlive(true);
        client->init(opts);
    }

    void TearDown() override {
        client->shutdown();
    }
};

const std::string APIIntegrationTest::BASE_URL = "http://127.0.0.1:" + std::to_string(API_TEST_PORT) + "/api";
const std::string APIIntegrationTest::JWT_SECRET_TEST = "integration_test_secret";
const std::string APIIntegrationTest::JWT_ISSUER_TEST = "integration-api-test";

// Helper function to send HTTP requests
Async::Promise<Http::Response> sendRequest(Http::Client* client, Http::Method method, const std::string& path, 
                                          const std::string& body = "", const std::string& token = "") {
    auto request = client->text().url(APIIntegrationTest::BASE_URL + path).method(method);
    if (!body.empty()) {
        request.body(body);
        request.header<Http::Header::ContentType>(MIME(Application, Json));
    }
    if (!token.empty()) {
        request.header<Http::Header::Authorization>(Pistache::Http::Header::BearerToken(token));
    }
    return request.send();
}

TEST_F(APIIntegrationTest, RegisterAndLoginUser) {
    // Register
    json reg_body = {{"username", "api_test_user"}, {"email", "api_test@example.com"}, {"password", "api_password"}};
    auto response = sendRequest(client.get(), Http::Method::Post, "/auth/register", reg_body.dump()).get();
    ASSERT_EQ(response.code(), Http::Code::Created);
    json reg_resp_body = json::parse(response.body());
    ASSERT_TRUE(reg_resp_body.contains("id"));
    ASSERT_EQ(reg_resp_body["username"], "api_test_user");
    TestCache::test_user_id = reg_resp_body["id"].get<long long>();

    // Login
    json login_body = {{"email", "api_test@example.com"}, {"password", "api_password"}};
    response = sendRequest(client.get(), Http::Method::Post, "/auth/login", login_body.dump()).get();
    ASSERT_EQ(response.code(), Http::Code::Ok);
    json login_resp_body = json::parse(response.body());
    ASSERT_TRUE(login_resp_body.contains("token"));
    TestCache::test_user_token = login_resp_body["token"].get<std::string>();
}

TEST_F(APIIntegrationTest, CreateProject) {
    ASSERT_FALSE(TestCache::test_user_token.empty());
    
    json project_body = {{"name", "API Test Project"}, {"description", "A project created via API test."}};
    auto response = sendRequest(client.get(), Http::Method::Post, "/projects", project_body.dump(), TestCache::test_user_token).get();
    ASSERT_EQ(response.code(), Http::Code::Created);
    json proj_resp_body = json::parse(response.body());
    ASSERT_TRUE(proj_resp_body.contains("id"));
    ASSERT_EQ(proj_resp_body["name"], "API Test Project");
    ASSERT_EQ(proj_resp_body["owner_id"], TestCache::test_user_id);
    TestCache::test_project_id = proj_resp_body["id"].get<long long>();
}

TEST_F(APIIntegrationTest, GetProjects) {
    ASSERT_FALSE(TestCache::test_user_token.empty());

    auto response = sendRequest(client.get(), Http::Method::Get, "/projects", "", TestCache::test_user_token).get();
    ASSERT_EQ(response.code(), Http::Code::Ok);
    json projects_array = json::parse(response.body());
    ASSERT_TRUE(projects_array.is_array());
    ASSERT_GT(projects_array.size(), 0);
    ASSERT_EQ(projects_array[0]["id"], TestCache::test_project_id);
}

TEST_F(APIIntegrationTest, GetProjectById) {
    ASSERT_FALSE(TestCache::test_user_token.empty());
    ASSERT_GT(TestCache::test_project_id, 0);

    std::string path = "/projects/" + std::to_string(TestCache::test_project_id);
    auto response = sendRequest(client.get(), Http::Method::Get, path, "", TestCache::test_user_token).get();
    ASSERT_EQ(response.code(), Http::Code::Ok);
    json proj_resp_body = json::parse(response.body());
    ASSERT_EQ(proj_resp_body["id"], TestCache::test_project_id);
    ASSERT_EQ(proj_resp_body["name"], "API Test Project");

    // Test non-existent ID
    response = sendRequest(client.get(), Http::Method::Get, "/projects/99999", "", TestCache::test_user_token).get();
    ASSERT_EQ(response.code(), Http::Code::Not_Found);
}

TEST_F(APIIntegrationTest, UpdateProject) {
    ASSERT_FALSE(TestCache::test_user_token.empty());
    ASSERT_GT(TestCache::test_project_id, 0);

    json update_body = {{"name", "Updated API Test Project"}, {"description", "Description updated."}};
    std::string path = "/projects/" + std::to_string(TestCache::test_project_id);
    auto response = sendRequest(client.get(), Http::Method::Put, path, update_body.dump(), TestCache::test_user_token).get();
    ASSERT_EQ(response.code(), Http::Code::Ok);
    json updated_proj = json::parse(response.body());
    ASSERT_EQ(updated_proj["name"], "Updated API Test Project");
    ASSERT_EQ(updated_proj["description"], "Description updated.");
}

TEST_F(APIIntegrationTest, CreateTask) {
    ASSERT_FALSE(TestCache::test_user_token.empty());
    ASSERT_GT(TestCache::test_project_id, 0);
    ASSERT_GT(TestCache::test_user_id, 0);

    json task_body = {
        {"title", "API Test Task"},
        {"description", "A task for the API Test Project."},
        {"project_id", TestCache::test_project_id},
        {"assigned_user_id", TestCache::test_user_id},
        {"status", "OPEN"},
        {"due_date", "2024-03-30T10:00:00Z"}
    };
    auto response = sendRequest(client.get(), Http::Method::Post, "/tasks", task_body.dump(), TestCache::test_user_token).get();
    ASSERT_EQ(response.code(), Http::Code::Created);
    json task_resp_body = json::parse(response.body());
    ASSERT_TRUE(task_resp_body.contains("id"));
    ASSERT_EQ(task_resp_body["title"], "API Test Task");
    ASSERT_EQ(task_resp_body["project_id"], TestCache::test_project_id);
    ASSERT_EQ(task_resp_body["assigned_user_id"], TestCache::test_user_id);
    TestCache::test_task_id = task_resp_body["id"].get<long long>();
}

TEST_F(APIIntegrationTest, GetTasks) {
    ASSERT_FALSE(TestCache::test_user_token.empty());

    auto response = sendRequest(client.get(), Http::Method::Get, "/tasks", "", TestCache::test_user_token).get();
    ASSERT_EQ(response.code(), Http::Code::Ok);
    json tasks_array = json::parse(response.body());
    ASSERT_TRUE(tasks_array.is_array());
    ASSERT_GT(tasks_array.size(), 0);
    ASSERT_EQ(tasks_array[0]["id"], TestCache::test_task_id);
}

TEST_F(APIIntegrationTest, UpdateTask) {
    ASSERT_FALSE(TestCache::test_user_token.empty());
    ASSERT_GT(TestCache::test_task_id, 0);

    json update_body = {{"title", "Updated API Test Task"}, {"status", "IN_PROGRESS"}};
    std::string path = "/tasks/" + std::to_string(TestCache::test_task_id);
    auto response = sendRequest(client.get(), Http::Method::Put, path, update_body.dump(), TestCache::test_user_token).get();
    ASSERT_EQ(response.code(), Http::Code::Ok);
    json updated_task = json::parse(response.body());
    ASSERT_EQ(updated_task["title"], "Updated API Test Task");
    ASSERT_EQ(updated_task["status"], "IN_PROGRESS");
}

TEST_F(APIIntegrationTest, DeleteTask) {
    ASSERT_FALSE(TestCache::test_user_token.empty());
    ASSERT_GT(TestCache::test_task_id, 0);

    std::string path = "/tasks/" + std::to_string(TestCache::test_task_id);
    auto response = sendRequest(client.get(), Http::Method::Delete, path, "", TestCache::test_user_token).get();
    ASSERT_EQ(response.code(), Http::Code::No_Content);

    // Verify deletion
    response = sendRequest(client.get(), Http::Method::Get, path, "", TestCache::test_user_token).get();
    ASSERT_EQ(response.code(), Http::Code::Not_Found);
}

TEST_F(APIIntegrationTest, DeleteProject) {
    ASSERT_FALSE(TestCache::test_user_token.empty());
    ASSERT_GT(TestCache::test_project_id, 0);

    std::string path = "/projects/" + std::to_string(TestCache::test_project_id);
    auto response = sendRequest(client.get(), Http::Method::Delete, path, "", TestCache::test_user_token).get();
    ASSERT_EQ(response.code(), Http::Code::No_Content);

    // Verify deletion
    response = sendRequest(client.get(), Http::Method::Get, path, "", TestCache::test_user_token).get();
    ASSERT_EQ(response.code(), Http::Code::Not_Found);
}

TEST_F(APIIntegrationTest, UnauthorizedAccess) {
    // Attempt to access a protected route without a token
    auto response = sendRequest(client.get(), Http::Method::Get, "/projects").get();
    ASSERT_EQ(response.code(), Http::Code::Unauthorized);

    // Attempt with an invalid token
    response = sendRequest(client.get(), Http::Method::Get, "/projects", "", "Bearer invalid.token.here").get();
    ASSERT_EQ(response.code(), Http::Code::Unauthorized);
}

TEST_F(APIIntegrationTest, RateLimiting) {
    // This test relies on the RateLimiter config in App.cpp (default 100 req/60s).
    // For a quick test, let's hit a public endpoint (e.g., login) rapidly.
    // The RateLimiter is applied globally.
    // Resetting global rate limiter state between tests is hard with a static member.
    // A better approach would be to make RateLimiter an instance that can be mocked/reinitialized.
    // For this example, we'll just demonstrate it generally.

    // Try to hit the login endpoint 10 times rapidly
    // If RATE_LIMIT_MAX_REQUESTS is low (e.g., 5) and TIME_WINDOW is small, this will trigger
    int hit_limit = Config::getInt("RATE_LIMIT_MAX_REQUESTS", 100) + 1; // +1 to exceed
    std::string test_email = "ratelimittest@example.com";
    std::string test_password = "password";

    // Register a user first for valid login attempts (though unauthorized attempts also count)
    json reg_body = {{"username", "rate_user"}, {"email", test_email,}, {"password", test_password}};
    sendRequest(client.get(), Http::Method::Post, "/auth/register", reg_body.dump()).get();

    json login_body = {{"email", test_email}, {"password", test_password}};
    Http::Response last_response;
    for (int i = 0; i < hit_limit; ++i) {
        last_response = sendRequest(client.get(), Http::Method::Post, "/auth/login", login_body.dump()).get();
        // std::this_thread::sleep_for(std::chrono::milliseconds(5)); // Small delay to avoid network issues
    }
    
    // The last request should be 429 Too Many Requests if `hit_limit` is indeed over the configured `MAX_REQUESTS`
    // And if `TIME_WINDOW` is large enough that we hit the limit before it resets.
    // This is hard to guarantee in a single test without careful orchestration or custom RateLimiter config.
    // For a default of 100 req/min, hitting it 101 times in quick succession should trigger it.
    ASSERT_EQ(last_response.code(), Http::Code::Too_Many_Requests);
}
```