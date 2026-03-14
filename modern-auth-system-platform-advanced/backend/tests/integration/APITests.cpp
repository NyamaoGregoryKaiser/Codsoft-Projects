#include <gtest/gtest.h>
#include <pistache/client.h>
#include <pistache/http.h>
#include <pistache/cookie.h>
#include <nlohmann/json.hpp>
#include "../../src/config/Config.h" // To get HTTP_PORT
#include "../../src/logger/Logger.h" // For logger initialization

// Note: This integration test requires the C++ backend server to be running.
// It uses Pistache's HttpClient, which is a simple way to make HTTP requests from C++.

// Global setup for Config and Logger (similar to unit tests)
struct GlobalAPITestEnvironment : public ::testing::Environment {
    void SetUp() override {
        Logger::init();
        Logger::getLogger()->info("Setting up API integration tests environment...");
        // Set up minimal config for tests that need HTTP_PORT
        // Use dummy values for JWT/DB as they are not directly used by HttpClient,
        // but Config::load needs them.
#ifdef _WIN32
        _putenv_s("HTTP_PORT", "9080"); // Must match actual server port
        _putenv_s("DB_HOST", "localhost");
        _putenv_s("DB_PORT", "5432");
        _putenv_s("DB_USER", "testuser");
        _putenv_s("DB_PASSWORD", "testpass");
        _putenv_s("DB_NAME", "testdb");
        _putenv_s("JWT_SECRET", "test_access_secret_123");
        _putenv_s("JWT_REFRESH_SECRET", "test_refresh_secret_456");
        _putenv_s("JWT_ACCESS_TOKEN_EXPIRATION_MINUTES", "1");
        _putenv_s("JWT_REFRESH_TOKEN_EXPIRATION_MINUTES", "10");
        _putenv_s("RATE_LIMIT_MAX_REQUESTS", "10");
        _putenv_s("RATE_LIMIT_WINDOW_SECONDS", "60");
#else
        setenv("HTTP_PORT", "9080", 1);
        setenv("DB_HOST", "localhost", 1);
        setenv("DB_PORT", "5432", 1);
        setenv("DB_USER", "testuser", 1);
        setenv("DB_PASSWORD", "testpass", 1);
        setenv("DB_NAME", "testdb", 1);
        setenv("JWT_SECRET", "test_access_secret_123", 1);
        setenv("JWT_REFRESH_SECRET", "test_refresh_secret_456", 1);
        setenv("JWT_ACCESS_TOKEN_EXPIRATION_MINUTES", "1", 1);
        setenv("JWT_REFRESH_TOKEN_EXPIRATION_MINUTES", "10", 1);
        setenv("RATE_LIMIT_MAX_REQUESTS", "10", 1);
        setenv("RATE_LIMIT_WINDOW_SECONDS", "60", 1);
#endif
        Config::load(".env.test");
    }

    void TearDown() override {
        Logger::getLogger()->info("API integration tests environment torn down.");
    }
};

[[maybe_unused]] testing::Environment* const api_env = testing::AddGlobalTestEnvironment(new GlobalAPITestEnvironment);


class ApiTest : public ::testing::Test {
protected:
    Pistache::Http::Client client;
    std::string baseUrl;
    Pistache::Async::Promise<Pistache::Http::Response> responsePromise;
    Pistache::Http::Code statusCode;
    std::string responseBody;
    std::string accessToken;
    std::string refreshToken;

    void SetUp() override {
        client.init();
        baseUrl = "http://localhost:" + std::to_string(Config::getHttpPort()) + "/api";
        // Ensure a clean state if possible, e.g., delete test user from DB
        // For actual cleanup, direct DB access from test might be needed or a dedicated API endpoint.
        Logger::getLogger()->info("API Test starting. Base URL: {}", baseUrl);
    }

    void TearDown() override {
        client.shutdown();
        accessToken.clear();
        refreshToken.clear();
        Logger::getLogger()->info("API Test finished.");
    }

    void makeRequest(Pistache::Http::Method method, const std::string& path, const nlohmann::json& body = {}, const std::string& token = "") {
        Pistache::Http::Uri uri(baseUrl + path);
        Pistache::Http::Request req(method, uri);
        req.headers().add<Pistache::Http::Header::ContentType>(Pistache::Http::Mime::MediaType("application/json"));
        
        if (!token.empty()) {
            req.headers().add<Pistache::Http::Header::Authorization>(Pistache::Http::Header::Authorization(Pistache::Http::Scheme::Bearer, token));
        }

        if (method == Pistache::Http::Method::Post || method == Pistache::Http::Method::Put) {
            req.body(body.dump());
        }

        responsePromise = client.send(req);
        responsePromise.then(
            [&](Pistache::Http::Response res) {
                statusCode = res.code();
                responseBody = res.body();
                Logger::getLogger()->debug("Response [{} {}]: Status={}, Body={}", req.method().toString(), req.resource(), statusCode, responseBody);
            },
            Pistache::Async::Throw); // Throw exceptions from failed promises

        Pistache::Async::Barrier<Pistache::Http::Response> barrier(responsePromise);
        barrier.wait(); // Wait for the response
    }
};

TEST_F(ApiTest, RegisterUserSuccess) {
    nlohmann::json body;
    body["username"] = "test_user_reg";
    body["password"] = "password123";
    
    makeRequest(Pistache::Http::Method::Post, "/auth/register", body);

    ASSERT_EQ(statusCode, Pistache::Http::Code::Created);
    nlohmann::json responseJson = nlohmann::json::parse(responseBody);
    ASSERT_EQ(responseJson["status"], "success");
    ASSERT_EQ(responseJson["user"]["username"], "test_user_reg");
}

TEST_F(ApiTest, RegisterDuplicateUserFails) {
    // First, register successfully
    nlohmann::json body;
    body["username"] = "duplicate_user";
    body["password"] = "password123";
    makeRequest(Pistache::Http::Method::Post, "/auth/register", body);
    ASSERT_EQ(statusCode, Pistache::Http::Code::Created);

    // Then, try to register again with same username
    makeRequest(Pistache::Http::Method::Post, "/auth/register", body);
    ASSERT_EQ(statusCode, Pistache::Http::Code::Conflict); // 409 Conflict
    nlohmann::json responseJson = nlohmann::json::parse(responseBody);
    ASSERT_EQ(responseJson["status"], "error");
    ASSERT_EQ(responseJson["message"], "User with this username already exists.");
}

TEST_F(ApiTest, LoginUserSuccess) {
    // First, register a user
    nlohmann::json regBody;
    regBody["username"] = "test_user_login";
    regBody["password"] = "password123";
    makeRequest(Pistache::Http::Method::Post, "/auth/register", regBody);
    ASSERT_EQ(statusCode, Pistache::Http::Code::Created);

    // Then, attempt to login
    nlohmann::json loginBody;
    loginBody["username"] = "test_user_login";
    loginBody["password"] = "password123";
    makeRequest(Pistache::Http::Method::Post, "/auth/login", loginBody);

    ASSERT_EQ(statusCode, Pistache::Http::Code::Ok);
    nlohmann::json responseJson = nlohmann::json::parse(responseBody);
    ASSERT_EQ(responseJson["status"], "success");
    ASSERT_TRUE(responseJson.contains("accessToken"));
    ASSERT_TRUE(responseJson.contains("refreshToken"));
    accessToken = responseJson["accessToken"].get<std::string>();
    refreshToken = responseJson["refreshToken"].get<std::string>();
}

TEST_F(ApiTest, LoginUserInvalidCredentials) {
    // First, register a user
    nlohmann::json regBody;
    regBody["username"] = "bad_cred_user";
    regBody["password"] = "password123";
    makeRequest(Pistache::Http::Method::Post, "/auth/register", regBody);
    ASSERT_EQ(statusCode, Pistache::Http::Code::Created);

    // Attempt to login with wrong password
    nlohmann::json loginBody;
    loginBody["username"] = "bad_cred_user";
    loginBody["password"] = "wrongpassword";
    makeRequest(Pistache::Http::Method::Post, "/auth/login", loginBody);

    ASSERT_EQ(statusCode, Pistache::Http::Code::Unauthorized); // 401 Unauthorized
    nlohmann::json responseJson = nlohmann::json::parse(responseBody);
    ASSERT_EQ(responseJson["status"], "error");
    ASSERT_EQ(responseJson["message"], "Invalid credentials.");
}

TEST_F(ApiTest, GetUserProfileRequiresAuth) {
    makeRequest(Pistache::Http::Method::Get, "/users/profile"); // No token provided

    ASSERT_EQ(statusCode, Pistache::Http::Code::Unauthorized);
    nlohmann::json responseJson = nlohmann::json::parse(responseBody);
    ASSERT_EQ(responseJson["status"], "error");
    ASSERT_EQ(responseJson["message"], "Authentication required.");
}

TEST_F(ApiTest, GetUserProfileSuccess) {
    // Login first to get a token
    LoginUserSuccess(); // Uses the LoginUserSuccess test as a setup, populating accessToken

    makeRequest(Pistache::Http::Method::Get, "/users/profile", {}, accessToken);

    ASSERT_EQ(statusCode, Pistache::Http::Code::Ok);
    nlohmann::json responseJson = nlohmann::json::parse(responseBody);
    ASSERT_EQ(responseJson["status"], "success");
    ASSERT_EQ(responseJson["user"]["username"], "test_user_login");
    ASSERT_EQ(responseJson["user"]["role"], "USER");
}

TEST_F(ApiTest, RefreshTokenSuccess) {
    // Login first to get refresh token
    LoginUserSuccess(); // accessToken and refreshToken are now populated

    nlohmann::json body;
    body["refreshToken"] = refreshToken;
    makeRequest(Pistache::Http::Method::Post, "/auth/refresh", body);

    ASSERT_EQ(statusCode, Pistache::Http::Code::Ok);
    nlohmann::json responseJson = nlohmann::json::parse(responseBody);
    ASSERT_EQ(responseJson["status"], "success");
    ASSERT_TRUE(responseJson.contains("accessToken"));
    ASSERT_TRUE(responseJson.contains("refreshToken"));
    ASSERT_NE(responseJson["accessToken"].get<std::string>(), accessToken); // Should be new tokens
    ASSERT_NE(responseJson["refreshToken"].get<std::string>(), refreshToken);
}

TEST_F(ApiTest, RefreshTokenInvalid) {
    nlohmann::json body;
    body["refreshToken"] = "invalid.refresh.token";
    makeRequest(Pistache::Http::Method::Post, "/auth/refresh", body);

    ASSERT_EQ(statusCode, Pistache::Http::Code::Unauthorized);
    nlohmann::json responseJson = nlohmann::json::parse(responseBody);
    ASSERT_EQ(responseJson["status"], "error");
    ASSERT_EQ(responseJson["message"], "Invalid or expired refresh token.");
}

TEST_F(ApiTest, AdminGetAllUsersRequiresAdminRole) {
    // Login a regular user
    LoginUserSuccess();

    makeRequest(Pistache::Http::Method::Get, "/admin/users", {}, accessToken);

    ASSERT_EQ(statusCode, Pistache::Http::Code::Forbidden); // 403 Forbidden
    nlohmann::json responseJson = nlohmann::json::parse(responseBody);
    ASSERT_EQ(responseJson["status"], "error");
    ASSERT_EQ(responseJson["message"], "Insufficient permissions.");
}

TEST_F(ApiTest, AdminGetAllUsersSuccess) {
    // Register an admin user for this test
    nlohmann::json adminRegBody;
    adminRegBody["username"] = "test_admin";
    adminRegBody["password"] = "adminpass123";
    adminRegBody["role"] = "ADMIN";
    makeRequest(Pistache::Http::Method::Post, "/auth/register", adminRegBody);
    ASSERT_EQ(statusCode, Pistache::Http::Code::Created);

    // Login the admin user
    nlohmann::json adminLoginBody;
    adminLoginBody["username"] = "test_admin";
    adminLoginBody["password"] = "adminpass123";
    makeRequest(Pistache::Http::Method::Post, "/auth/login", adminLoginBody);
    ASSERT_EQ(statusCode, Pistache::Http::Code::Ok);
    nlohmann::json adminLoginResponse = nlohmann::json::parse(responseBody);
    std::string adminAccessToken = adminLoginResponse["accessToken"].get<std::string>();

    // Now, access the admin endpoint
    makeRequest(Pistache::Http::Method::Get, "/admin/users", {}, adminAccessToken);

    ASSERT_EQ(statusCode, Pistache::Http::Code::Ok);
    nlohmann::json responseJson = nlohmann::json::parse(responseBody);
    ASSERT_EQ(responseJson["status"], "success");
    ASSERT_TRUE(responseJson.contains("users"));
    ASSERT_TRUE(responseJson["users"].is_array());
    ASSERT_GE(responseJson["users"].size(), 1); // At least the admin user
}
```

### Performance Tests
Performance testing (load, stress, soak) requires dedicated tools and infrastructure. Here's a conceptual guide:

```markdown