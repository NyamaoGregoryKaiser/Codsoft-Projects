#include "gtest/gtest.h"
#include "crow.h"
#include "nlohmann/json.hpp"
#include "../../main.cpp" // Include main to get access to app instance

// Forward declaration of the Crow app instance (if it's global or accessible)
// In a real integration test, you'd start the server in a separate thread
// and make actual HTTP requests to it. For this example, we'll try to
// run the server in the test itself or mock its core components for "integration".
// Given the complexity of Crow's `App` and `run()`, actually spinning up a server
// in a unit test is not ideal. A separate process and curl/http client is better.
// For this mock, we'll simulate the route calls.

// Global app instance (or shared pointer if dynamically allocated)
// This is typically not how you'd structure an integration test.
// A more robust approach involves:
// 1. Starting the application in a separate process.
// 2. Using an HTTP client library (e.g., cpr, Boost.Asio) to make real requests.
// 3. Ensuring a clean test database.
// For the sake of demonstrating code structure within limits, we'll use a simplified mock.

// To truly integrate with the app, we need to expose the main app instance for testing
// This requires modifying `main.cpp` to return the `crow::App` instance or make it globally accessible.
// For this example, we'll *assume* `main.cpp` can be included and its parts used.
// This is a simplification.

// Mocking required services and repositories for 'integration' if not using a real running server
// This blurs the line between unit and integration tests but is simpler for demonstration.
// For true API integration tests, you'd point to `localhost:8080`.

// We'll create a minimal Crow app and explicitly call the controller handlers.
// This is *not* a true API integration test hitting HTTP endpoints, but an integration
// of controllers, services, and repositories (with a mocked DB).

// Mock DBConnectionPool (same as in unit tests)
class MockDBConnectionPool : public DBConnectionPool {
public:
    MockDBConnectionPool() : DBConnectionPool("host=mock port=1 user=mock dbname=mock password=mock", 1) {}
    std::unique_ptr<DBConnection> acquireConnection() override {
        return std::make_unique<DBConnection>("host=mock port=1 user=mock dbname=mock password=mock");
    }
    void releaseConnection(std::unique_ptr<DBConnection> conn) override { (void)conn; }
};

// Mock Repositories for "Integration" of Controllers+Services without full DB
// This allows testing the full stack *logic* without a real database,
// focusing on the data flow through layers.
class MockUserRepository : public UserRepository {
public:
    MockUserRepository(std::shared_ptr<DBConnectionPool> pool) : UserRepository(std::move(pool)) {}
    MOCK_METHOD(std::optional<User>, findById, (int), (override));
    MOCK_METHOD(std::optional<User>, findByEmail, (const std::string&), (override));
    MOCK_METHOD(User, createUser, (const User&), (override));
    MOCK_METHOD(bool, updateUser, (const User&), (override));
    MOCK_METHOD(bool, deleteUser, (int), (override));
};

class MockModelRepository : public ModelRepository {
public:
    MockModelRepository(std::shared_ptr<DBConnectionPool> pool) : ModelRepository(std::move(pool)) {}
    MOCK_METHOD(MLModel, createModel, (const MLModel&), (override));
    MOCK_METHOD(std::optional<MLModel>, findModelById, (int), (override));
    MOCK_METHOD(std::vector<MLModel>, findModelsByOwner, (int), (override));
    MOCK_METHOD(std::vector<MLModel>, findAllModels, (), (override));
    MOCK_METHOD(bool, updateModel, (const MLModel&), (override));
    MOCK_METHOD(bool, deleteModel, (int, int), (override));
    MOCK_METHOD(DataPoint, createDataPoint, (const DataPoint&), (override));
    MOCK_METHOD(std::optional<DataPoint>, findDataPointByIdAndUser, (int, int), (override));
    MOCK_METHOD(std::vector<DataPoint>, findDataPointsByModelAndUser, (int, int), (override));
};


class APIIntegrationTest : public ::testing::Test {
protected:
    crow::App<
        LoggingMiddleware,
        ErrorMiddleware,
        AuthMiddleware,
        RateLimitMiddleware
    > app;

    std::shared_ptr<MockDBConnectionPool> mock_db_pool;
    std::shared_ptr<MockUserRepository> mock_user_repo;
    std::shared_ptr<MockModelRepository> mock_model_repo;

    std::shared_ptr<AuthService> auth_service;
    std::shared_ptr<UserService> user_service;
    std::shared_ptr<MLService> ml_service;

    std::unique_ptr<AuthController> auth_controller;
    std::unique_ptr<UserController> user_controller;
    std::unique_ptr<ModelController> model_controller;
    std::unique_ptr<DataController> data_controller;

    // A dummy context for middleware
    AuthMiddleware::context auth_ctx;

    void SetUp() override {
        Logger::init();
        Config::loadFromEnv();
        JWTManager::init("test_secret_for_integration", 1); // Specific JWT for integration
        CacheManager::init(60); // Cache for integration tests

        mock_db_pool = std::make_shared<MockDBConnectionPool>();
        mock_user_repo = std::make_shared<MockUserRepository>(mock_db_pool);
        mock_model_repo = std::make_shared<MockModelRepository>(mock_db_pool);

        auth_service = std::make_shared<AuthService>(mock_user_repo);
        user_service = std::make_shared<UserService>(mock_user_repo);
        ml_service = std::make_shared<MLService>(mock_model_repo);

        auth_controller = std::make_unique<AuthController>(app, auth_service);
        user_controller = std::make_unique<UserController>(app, user_service);
        model_controller = std::make_unique<ModelController>(app, ml_service);
        data_controller = std::make_unique<DataController>(app, ml_service);

        app.loglevel(crow::LogLevel::Debug); // Set app logging level for tests
        // NOTE: Running app.validate() here might cause issues if routes aren't fully registered.
        // For testing handlers directly, it's not strictly necessary.
    }

    void TearDown() override {
        CacheManager::clear();
    }

    // Helper to create a mock request with JSON body
    crow::request create_json_request(const std::string& method, const std::string& url, const nlohmann::json& body_json = {}) {
        crow::request req;
        req.method = crow::method_from_string(method);
        req.url = url;
        req.header_map["Content-Type"] = "application/json";
        req.body = body_json.dump();
        return req;
    }

    // Helper to create a mock authenticated request
    crow::request create_auth_request(const std::string& method, const std::string& url, int user_id, const std::string& role, const nlohmann::json& body_json = {}) {
        crow::request req = create_json_request(method, url, body_json);
        std::string token = JWTManager::createToken(user_id, role);
        req.header_map["Authorization"] = "Bearer " + token;
        
        // Populate auth_ctx for direct handler calls
        auth_ctx.user_id = user_id;
        auth_ctx.user_role = role;

        return req;
    }
};

TEST_F(APIIntegrationTest, AuthRegisterAndLogin) {
    // Mock for AuthController -> AuthService -> UserRepository
    User new_user_data{0, "register@example.com", "hash", "user", {}, {}};
    User registered_user_data = new_user_data;
    registered_user_data.id = 1;
    registered_user_data.created_at = std::chrono::system_clock::now();
    registered_user_data.updated_at = std::chrono::system_clock::now();

    // Mock findByEmail to return nullopt for initial check
    EXPECT_CALL(*mock_user_repo, findByEmail("register@example.com"))
        .WillOnce(::testing::Return(std::nullopt))
        .WillOnce(::testing::Return(registered_user_data)); // For subsequent login check

    // Mock createUser
    EXPECT_CALL(*mock_user_repo, createUser(::testing::_))
        .WillOnce(::testing::Return(registered_user_data));

    // Register user
    crow::request reg_req = create_json_request("POST", "/api/auth/register", {{"email", "register@example.com"}, {"password", "pass123"}});
    crow::response reg_res;
    
    // Manually call the route handler
    // This part is tricky. Crow routes are often lambdas. We need to find and invoke them.
    // For direct integration testing of controllers, you'd typically expose the handler method.
    // Let's call the private handler methods directly for this example.
    // In a real system, you'd integrate an HTTP client for this or expose public methods.
    
    // Simulating the Crow route dispatch for AuthController's handleRegister
    try {
        reg_res = auth_controller->handleRegister(reg_req);
    } catch (const HttpError& e) {
        reg_res = crow::response(e.http_status, e.custom_message);
    }
    
    ASSERT_EQ(reg_res.code, 201);
    ASSERT_NE(reg_res.body.find("User registered successfully."), std::string::npos);
    
    // Login user
    crow::request login_req = create_json_request("POST", "/api/auth/login", {{"email", "register@example.com"}, {"password", "pass123"}});
    crow::response login_res;

    // Simulating the Crow route dispatch for AuthController's handleLogin
    try {
        login_res = auth_controller->handleLogin(login_req);
    } catch (const HttpError& e) {
        login_res = crow::response(e.http_status, e.custom_message);
    }

    ASSERT_EQ(login_res.code, 200);
    ASSERT_NE(login_res.body.find("token"), std::string::npos);

    auto login_json = nlohmann::json::parse(login_res.body);
    std::string token = login_json["token"].get<std::string>();
    ASSERT_FALSE(token.empty());
}

TEST_F(APIIntegrationTest, GetUserProfileAuthenticated) {
    int test_user_id = 1;
    std::string test_user_email = "user@example.com";
    User mock_user{test_user_id, test_user_email, "hash", "user", std::chrono::system_clock::now(), std::chrono::system_clock::now()};

    EXPECT_CALL(*mock_user_repo, findById(test_user_id))
        .WillOnce(::testing::Return(mock_user));

    crow::request req = create_auth_request("GET", "/api/users/me", test_user_id, "user");
    crow::response res;

    try {
        res = user_controller->handleGetUserProfile(req, auth_ctx);
    } catch (const HttpError& e) {
        res = crow::response(e.http_status, e.custom_message);
    }
    
    ASSERT_EQ(res.code, 200);
    auto res_json = nlohmann::json::parse(res.body);
    ASSERT_EQ(res_json["id"].get<int>(), test_user_id);
    ASSERT_EQ(res_json["email"].get<std::string>(), test_user_email);
}

TEST_F(APIIntegrationTest, RegisterModelAuthenticated) {
    int test_owner_id = 2;
    MLModel new_model_data{0, "TestModel", "1.0", "classification", "/models/test.onnx", "A test model", test_owner_id, {}, std::nullopt};
    MLModel created_model_data = new_model_data;
    created_model_data.id = 101;
    created_model_data.created_at = std::chrono::system_clock::now();

    EXPECT_CALL(*mock_model_repo, createModel(::testing::_))
        .WillOnce(::testing::Return(created_model_data));

    crow::request req = create_auth_request("POST", "/api/models", test_owner_id, "user", {
        {"name", "TestModel"},
        {"version", "1.0"},
        {"type", "classification"},
        {"filePath", "/models/test.onnx"},
        {"description", "A test model"}
    });
    crow::response res;

    try {
        res = model_controller->handleRegisterModel(req, auth_ctx);
    } catch (const HttpError& e) {
        res = crow::response(e.http_status, e.custom_message);
    }

    ASSERT_EQ(res.code, 201);
    auto res_json = nlohmann::json::parse(res.body);
    ASSERT_EQ(res_json["model"]["id"].get<int>(), 101);
    ASSERT_EQ(res_json["model"]["name"].get<std::string>(), "TestModel");
}

TEST_F(APIIntegrationTest, PerformInference) {
    int test_model_id = 3;
    int test_user_id = 4;
    MLModel mock_model{test_model_id, "InferModel", "1.0", "regression", "/models/infer.onnx", "", test_user_id, std::chrono::system_clock::now(), std::nullopt};
    DataPoint created_dp_data{1, test_model_id, test_user_id, R"({"value":10.0})", R"({"score":15.0})", std::chrono::system_clock::now()};

    EXPECT_CALL(*mock_model_repo, findModelById(test_model_id))
        .WillOnce(::testing::Return(mock_model));
    EXPECT_CALL(*mock_model_repo, createDataPoint(::testing::_))
        .WillOnce(::testing::Return(created_dp_data));

    crow::request req = create_auth_request("POST", "/api/models/3/infer", test_user_id, "user", {{"value", 10.0}});
    crow::response res;

    try {
        res = data_controller->handlePerformInference(req, auth_ctx, test_model_id);
    } catch (const HttpError& e) {
        res = crow::response(e.http_status, e.custom_message);
    }

    ASSERT_EQ(res.code, 200);
    auto res_json = nlohmann::json::parse(res.body);
    ASSERT_NE(res_json["dataPoint"].dump().find("score"), std::string::npos);
    ASSERT_EQ(res_json["dataPoint"]["modelId"].get<int>(), test_model_id);
    ASSERT_EQ(res_json["dataPoint"]["userId"].get<int>(), test_user_id);
}
```