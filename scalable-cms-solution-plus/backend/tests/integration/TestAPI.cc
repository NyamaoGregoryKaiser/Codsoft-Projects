#include <gtest/gtest.h>
#include <drogon/drogon.h>
#include <drogon/HttpClient.h>
#include "config/AppConfig.h"
#include "utils/Logger.h"
#include "common/Constants.h"
#include "services/AuthService.h" // For pre-creating users
#include "database/DbClientManager.h"

#include <chrono>
#include <thread>
#include <future> // For asynchronous checks

// Global setup for integration tests
class APIIntegrationTestFixture : public ::testing::Test {
protected:
    static void SetUpTestSuite() {
        // Load test configuration (make sure it points to a test DB)
        AppConfig::loadConfig("../config/test.json", true);
        Logger::initialize("logs/test_cms_backend_integration.log", spdlog::level::debug);
        LOG_INFO("APIIntegrationTestFixture: Setting up test suite...");

        // Ensure Drogon app is configured for testing
        drogon::app().loadConfig("../config/test.json");
        drogon::app().enableRuningStaticFiles(false);
        drogon::app().setThreadNum(1); // Single thread for deterministic testing
        drogon::app().setLogPath("./logs"); // Ensure logs are redirected
        drogon::app().setLogLevel(spdlog::level::debug);
        drogon::app().setHttpPort(8080); // Ensure a consistent port

        // Initialize DbClientManager
        DbClientManager::instance().init();

        // Clear test database
        auto dbClient = DbClientManager::instance().getDbClient();
        if (dbClient) {
            dbClient->execSqlSync("DELETE FROM posts");
            dbClient->execSqlSync("DELETE FROM categories");
            dbClient->execSqlSync("DELETE FROM users");
            LOG_INFO("Cleared database tables for integration tests.");
        } else {
            LOG_CRITICAL("Failed to get DB client for integration test setup.");
            FAIL() << "Failed to connect to test database.";
        }
        
        // Start the Drogon app in a separate thread
        std::promise<void> p;
        std::future<void> f = p.get_future();
        std::thread([](std::promise<void> p) {
            drogon::app().setReadyCallback([p = std::move(p)]() mutable {
                LOG_INFO("Drogon app is ready.");
                p.set_value();
            });
            drogon::app().run(); // Blocks until app.quit()
        }, std::move(p)).detach();
        
        f.wait(); // Wait for the app to be ready
        LOG_INFO("Drogon app started for integration tests.");

        // Create a test admin user and store its tokens
        std::string adminEmail = "integration_admin@example.com";
        std::string adminPassword = "integration_admin_password";
        auto adminUser = cms::AuthService::instance().registerUser(adminEmail, adminPassword, cms::UserRole::ADMIN);
        ASSERT_TRUE(adminUser.has_value());
        
        auto adminLogin = cms::AuthService::instance().loginUser(adminEmail, adminPassword);
        ASSERT_TRUE(adminLogin.has_value());
        adminAccessToken = adminLogin->accessToken;
        adminRefreshToken = adminLogin->refreshToken;
        adminUserId = adminLogin->userId;
        LOG_INFO("Test Admin User created with ID: {}", adminUserId);

        // Create a test regular user
        std::string userEmail = "integration_user@example.com";
        std::string userPassword = "integration_user_password";
        auto normalUser = cms::AuthService::instance().registerUser(userEmail, userPassword, cms::UserRole::USER);
        ASSERT_TRUE(normalUser.has_value());

        auto userLogin = cms::AuthService::instance().loginUser(userEmail, userPassword);
        ASSERT_TRUE(userLogin.has_value());
        userAccessToken = userLogin->accessToken;
        userRefreshToken = userLogin->refreshToken;
        userId = userLogin->userId;
        LOG_INFO("Test Normal User created with ID: {}", userId);
    }

    static void TearDownTestSuite() {
        LOG_INFO("APIIntegrationTestFixture: Tearing down test suite...");
        drogon::app().quit(); // Stop the Drogon app
        // Clear database again
        auto dbClient = DbClientManager::instance().getDbClient();
        if (dbClient) {
            dbClient->execSqlSync("DELETE FROM posts");
            dbClient->execSqlSync("DELETE FROM categories");
            dbClient->execSqlSync("DELETE FROM users");
        }
    }

    // Static members to hold tokens and IDs
    static std::string adminAccessToken;
    static std::string adminRefreshToken;
    static std::string adminUserId;
    static std::string userAccessToken;
    static std::string userRefreshToken;
    static std::string userId;

    drogon::HttpClientPtr client = drogon::HttpClient::newHttpClient("http://127.0.0.1:8080");

    Json::Value parseResponse(const drogon::HttpResponsePtr& resp) {
        if (!resp || resp->getBody().empty()) {
            return Json::Value();
        }
        Json::CharReaderBuilder rbuilder;
        std::string errs;
        Json::Value root;
        std::istringstream(resp->getBody()) >> root;
        return root;
    }
};

std::string APIIntegrationTestFixture::adminAccessToken = "";
std::string APIIntegrationTestFixture::adminRefreshToken = "";
std::string APIIntegrationTestFixture::adminUserId = "";
std::string APIIntegrationTestFixture::userAccessToken = "";
std::string APIIntegrationTestFixture::userRefreshToken = "";
std::string APIIntegrationTestFixture::userId = "";


// --- Authentication Tests ---

TEST_F(APIIntegrationTestFixture, AuthRegisterSuccess) {
    Json::Value requestBody;
    requestBody["email"] = "newuser@test.com";
    requestBody["password"] = "newuser_pass";

    auto req = drogon::HttpRequest::newHttpJsonRequest(requestBody);
    req->setPath(cms::AUTH_REGISTER_PATH);
    req->setMethod(drogon::HttpMethod::Post);

    auto resp = client->sendRequest(req);
    ASSERT_TRUE(resp != nullptr);
    ASSERT_EQ(resp->getStatusCode(), drogon::k200OK);
    Json::Value jsonResp = parseResponse(resp);
    ASSERT_TRUE(jsonResp.isMember("userId"));
    ASSERT_EQ(jsonResp["email"].asString(), "newuser@test.com");
}

TEST_F(APIIntegrationTestFixture, AuthRegisterDuplicateEmail) {
    Json::Value requestBody;
    requestBody["email"] = "duplicate@test.com";
    requestBody["password"] = "pass";

    auto req1 = drogon::HttpRequest::newHttpJsonRequest(requestBody);
    req1->setPath(cms::AUTH_REGISTER_PATH);
    req1->setMethod(drogon::HttpMethod::Post);
    auto resp1 = client->sendRequest(req1);
    ASSERT_EQ(resp1->getStatusCode(), drogon::k200OK);

    auto req2 = drogon::HttpRequest::newHttpJsonRequest(requestBody);
    req2->setPath(cms::AUTH_REGISTER_PATH);
    req2->setMethod(drogon::HttpMethod::Post);
    auto resp2 = client->sendRequest(req2);
    ASSERT_EQ(resp2->getStatusCode(), drogon::k409Conflict); // User exists
}

TEST_F(APIIntegrationTestFixture, AuthLoginSuccess) {
    Json::Value requestBody;
    requestBody["email"] = "login_test@test.com";
    requestBody["password"] = "login_pass";
    cms::AuthService::instance().registerUser(requestBody["email"].asString(), requestBody["password"].asString());

    auto req = drogon::HttpRequest::newHttpJsonRequest(requestBody);
    req->setPath(cms::AUTH_LOGIN_PATH);
    req->setMethod(drogon::HttpMethod::Post);

    auto resp = client->sendRequest(req);
    ASSERT_TRUE(resp != nullptr);
    ASSERT_EQ(resp->getStatusCode(), drogon::k200OK);
    Json::Value jsonResp = parseResponse(resp);
    ASSERT_TRUE(jsonResp.isMember("accessToken"));
    ASSERT_TRUE(jsonResp.isMember("refreshToken"));
}

TEST_F(APIIntegrationTestFixture, AuthLoginFailure) {
    Json::Value requestBody;
    requestBody["email"] = "nonexistent@test.com";
    requestBody["password"] = "wrong_pass";

    auto req = drogon::HttpRequest::newHttpJsonRequest(requestBody);
    req->setPath(cms::AUTH_LOGIN_PATH);
    req->setMethod(drogon::HttpMethod::Post);

    auto resp = client->sendRequest(req);
    ASSERT_TRUE(resp != nullptr);
    ASSERT_EQ(resp->getStatusCode(), drogon::k401Unauthorized);
}

TEST_F(APIIntegrationTestFixture, AuthLogoutSuccess) {
    Json::Value loginBody;
    loginBody["email"] = "logout_test@test.com";
    loginBody["password"] = "logout_pass";
    cms::AuthService::instance().registerUser(loginBody["email"].asString(), loginBody["password"].asString());

    auto loginReq = drogon::HttpRequest::newHttpJsonRequest(loginBody);
    loginReq->setPath(cms::AUTH_LOGIN_PATH);
    loginReq->setMethod(drogon::HttpMethod::Post);
    auto loginResp = client->sendRequest(loginReq);
    ASSERT_EQ(loginResp->getStatusCode(), drogon::k200OK);
    Json::Value loginJson = parseResponse(loginResp);
    std::string accessToken = loginJson["accessToken"].asString();
    std::string refreshToken = loginJson["refreshToken"].asString();

    Json::Value logoutBody;
    logoutBody["refreshToken"] = refreshToken; // Optionally send refresh token to blacklist it too

    auto logoutReq = drogon::HttpRequest::newHttpJsonRequest(logoutBody);
    logoutReq->setPath(cms::AUTH_LOGOUT_PATH);
    logoutReq->setMethod(drogon::HttpMethod::Post);
    logoutReq->addHeader("Authorization", "Bearer " + accessToken);

    auto logoutResp = client->sendRequest(logoutReq);
    ASSERT_TRUE(logoutResp != nullptr);
    ASSERT_EQ(logoutResp->getStatusCode(), drogon::k200OK);
    Json::Value logoutJson = parseResponse(logoutResp);
    ASSERT_EQ(logoutJson["message"].asString(), "Logged out successfully.");

    // Verify access token is blacklisted by trying to use it
    auto verifyReq = drogon::HttpRequest::newHttpRequest();
    verifyReq->setPath(cms::USER_PROFILE_PATH);
    verifyReq->setMethod(drogon::HttpMethod::Get);
    verifyReq->addHeader("Authorization", "Bearer " + accessToken);
    auto verifyResp = client->sendRequest(verifyReq);
    ASSERT_EQ(verifyResp->getStatusCode(), drogon::k401Unauthorized);
}


// --- User Profile Tests (Auth Required) ---

TEST_F(APIIntegrationTestFixture, GetUserProfileSuccess) {
    auto req = drogon::HttpRequest::newHttpRequest();
    req->setPath(cms::USER_PROFILE_PATH);
    req->setMethod(drogon::HttpMethod::Get);
    req->addHeader("Authorization", "Bearer " + userAccessToken);

    auto resp = client->sendRequest(req);
    ASSERT_TRUE(resp != nullptr);
    ASSERT_EQ(resp->getStatusCode(), drogon::k200OK);
    Json::Value jsonResp = parseResponse(resp);
    ASSERT_EQ(jsonResp["id"].asString(), userId);
    ASSERT_EQ(jsonResp["role"].asString(), "USER");
}

TEST_F(APIIntegrationTestFixture, GetUserProfileUnauthorized) {
    auto req = drogon::HttpRequest::newHttpRequest();
    req->setPath(cms::USER_PROFILE_PATH);
    req->setMethod(drogon::HttpMethod::Get);
    // No Authorization header

    auto resp = client->sendRequest(req);
    ASSERT_TRUE(resp != nullptr);
    ASSERT_EQ(resp->getStatusCode(), drogon::k401Unauthorized);
}

// --- Admin-only User Management Tests ---

TEST_F(APIIntegrationTestFixture, GetAllUsersAdminOnlySuccess) {
    auto req = drogon::HttpRequest::newHttpRequest();
    req->setPath(cms::USERS_BASE_PATH);
    req->setMethod(drogon::HttpMethod::Get);
    req->addHeader("Authorization", "Bearer " + adminAccessToken);

    auto resp = client->sendRequest(req);
    ASSERT_TRUE(resp != nullptr);
    ASSERT_EQ(resp->getStatusCode(), drogon::k200OK);
    Json::Value jsonResp = parseResponse(resp);
    ASSERT_TRUE(jsonResp.isArray());
    ASSERT_GE(jsonResp.size(), 2); // At least admin and normal user
}

TEST_F(APIIntegrationTestFixture, GetAllUsersForbiddenForNormalUser) {
    auto req = drogon::HttpRequest::newHttpRequest();
    req->setPath(cms::USERS_BASE_PATH);
    req->setMethod(drogon::HttpMethod::Get);
    req->addHeader("Authorization", "Bearer " + userAccessToken);

    auto resp = client->sendRequest(req);
    ASSERT_TRUE(resp != nullptr);
    ASSERT_EQ(resp->getStatusCode(), drogon::k403Forbidden);
}

// --- Category CRUD Tests ---

TEST_F(APIIntegrationTestFixture, CreateCategoryAdminSuccess) {
    Json::Value requestBody;
    requestBody["name"] = "Test Category";
    requestBody["description"] = "A category for testing.";

    auto req = drogon::HttpRequest::newHttpJsonRequest(requestBody);
    req->setPath(cms::CATEGORIES_BASE_PATH);
    req->setMethod(drogon::HttpMethod::Post);
    req->addHeader("Authorization", "Bearer " + adminAccessToken);

    auto resp = client->sendRequest(req);
    ASSERT_TRUE(resp != nullptr);
    ASSERT_EQ(resp->getStatusCode(), drogon::k200OK);
    Json::Value jsonResp = parseResponse(resp);
    ASSERT_TRUE(jsonResp.isMember("id"));
    ASSERT_EQ(jsonResp["name"].asString(), "Test Category");
}

// Add more tests for Category CRUD: GET, PUT, DELETE, and unauthorized attempts for each.

// --- Post CRUD Tests ---

TEST_F(APIIntegrationTestFixture, CreatePostUserSuccess) {
    // First, create a category
    Json::Value catBody;
    catBody["name"] = "Post Category";
    catBody["slug"] = "post-category";
    auto catReq = drogon::HttpRequest::newHttpJsonRequest(catBody);
    catReq->setPath(cms::CATEGORIES_BASE_PATH);
    catReq->setMethod(drogon::HttpMethod::Post);
    catReq->addHeader("Authorization", "Bearer " + adminAccessToken);
    auto catResp = client->sendRequest(catReq);
    ASSERT_EQ(catResp->getStatusCode(), drogon::k200OK);
    std::string categoryId = parseResponse(catResp)["id"].asString();

    Json::Value requestBody;
    requestBody["title"] = "My First Post";
    requestBody["content"] = "This is the content of my first post.";
    requestBody["categoryId"] = categoryId;

    auto req = drogon::HttpRequest::newHttpJsonRequest(requestBody);
    req->setPath(cms::POSTS_BASE_PATH);
    req->setMethod(drogon::HttpMethod::Post);
    req->addHeader("Authorization", "Bearer " + userAccessToken);

    auto resp = client->sendRequest(req);
    ASSERT_TRUE(resp != nullptr);
    ASSERT_EQ(resp->getStatusCode(), drogon::k200OK);
    Json::Value jsonResp = parseResponse(resp);
    ASSERT_TRUE(jsonResp.isMember("id"));
    ASSERT_EQ(jsonResp["title"].asString(), "My First Post");
    ASSERT_EQ(jsonResp["authorId"].asString(), userId);
    ASSERT_EQ(jsonResp["status"].asString(), "DRAFT");
    ASSERT_EQ(jsonResp["categoryId"].asString(), categoryId);
}

// Add more tests for Post CRUD: GET (public vs authenticated), PUT (ownership/admin), DELETE, Publish, Draft.
```