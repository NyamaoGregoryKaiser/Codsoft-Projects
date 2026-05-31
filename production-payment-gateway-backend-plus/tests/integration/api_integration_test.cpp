```cpp
#include <catch2/catch_all.hpp>
#include "../../src/api/routes.hpp"
#include "../../src/main.cpp" // Include main to get access to svr
#include <httplib.h>
#include <nlohmann/json.hpp>
#include <thread>
#include <chrono>

// For API tests, we need to run the server in a separate thread.
// It's crucial to manage the server lifecycle for tests.
// This is a simplified approach, a real test suite might use a dedicated
// test server instance or mock external services more rigorously.

// Forward declarations
void start_test_server(httplib::Server& server_instance);
void stop_test_server(httplib::Server& server_instance);

// Global server for API tests
extern httplib::Server svr; // From main.cpp

// Test fixture to manage server lifecycle for API tests
struct ApiTestFixture {
    std::thread server_thread;

    ApiTestFixture() {
        Zenith::Utils::Logger::getLogger(); // Ensure logger is initialized
        LOG_INFO("Starting API Test Server...");
        start_test_server(svr); // Use the global server instance
    }

    ~ApiTestFixture() {
        LOG_INFO("Stopping API Test Server...");
        stop_test_server(svr);
        if (server_thread.joinable()) {
            server_thread.join();
        }
    }

    void start_test_server(httplib::Server& server_instance) {
        // Initialize config and services for the server within the test scope
        const auto& config = Zenith::Config::AppConfig::getInstance(); // Loads from .env.example
        // The services are global pointers in routes.cpp, they need to be initialized.
        // This is handled in setupRoutes, which is called below.

        Zenith::Api::setupRoutes(server_instance); // Setup routes on the server instance

        server_thread = std::thread([&]() {
            if (!server_instance.listen(config.getServerHost().c_str(), config.getServerPort())) {
                LOG_CRITICAL("Failed to start API test server on {0}:{1}", config.getServerHost(), config.getServerPort());
                // Handle error appropriately, e.g., throw or set a flag
            }
        });
        // Give server a moment to start up
        std::this_thread::sleep_for(std::chrono::seconds(1));
    }

    void stop_test_server(httplib::Server& server_instance) {
        server_instance.stop();
    }
};

// Use the fixture for all API tests
// This will create one instance of the fixture and run its constructor/destructor once
// for the entire test file.
CATCH_TEST_CASE_METHOD(ApiTestFixture, "API Integration Tests", "[API][Integration]") {
    httplib::Client cli("http://localhost:8080");
    cli.set_read_timeout(5, 0); // 5 seconds read timeout
    cli.set_connection_timeout(5, 0); // 5 seconds connection timeout

    SECTION("Health Check Endpoint") {
        auto res = cli.Get("/health");
        REQUIRE(res);
        REQUIRE(res->status == 200);
        REQUIRE(nlohmann::json::parse(res->body)["status"] == "UP");
    }

    SECTION("User Registration and Login Flow") {
        std::string test_email = "test.api.user@example.com";
        std::string test_username = "testapiuser";
        std::string test_password = "ApiTestPassword123!";

        // Cleanup any previous test user (if exists)
        // Note: For a real test, you'd directly access DB or have a test-only API endpoint to clean.
        // For now, we rely on duplicate checks.

        // 1. Register a new user
        nlohmann::json register_payload;
        register_payload["username"] = test_username;
        register_payload["email"] = test_email;
        register_payload["password"] = test_password;
        register_payload["fullName"] = "Test API User";
        register_payload["address"] = "123 Test API Lane";
        register_payload["phoneNumber"] = "123-456-7890";
        register_payload["role"] = "customer";

        auto register_res = cli.Post("/auth/register", register_payload.dump(), "application/json");
        REQUIRE(register_res);
        REQUIRE(register_res->status == 201);
        auto register_json = nlohmann::json::parse(register_res->body);
        REQUIRE(register_json["message"] == "User registered successfully");
        REQUIRE(register_json.contains("userId"));
        long registered_user_id = register_json["userId"].get<long>();
        LOG_INFO("Registered user with ID: {0}", registered_user_id);

        // 2. Attempt to register with duplicate email (should fail)
        auto duplicate_register_res = cli.Post("/auth/register", register_payload.dump(), "application/json");
        REQUIRE(duplicate_register_res);
        REQUIRE(duplicate_register_res->status == 409);
        REQUIRE(nlohmann::json::parse(duplicate_register_res->body)["message"].get<std::string>().find("already exists") != std::string::npos);

        // 3. Login with the new user
        nlohmann::json login_payload;
        login_payload["email"] = test_email;
        login_payload["password"] = test_password;

        auto login_res = cli.Post("/auth/login", login_payload.dump(), "application/json");
        REQUIRE(login_res);
        REQUIRE(login_res->status == 200);
        auto login_json = nlohmann::json::parse(login_res->body);
        REQUIRE(login_json["message"] == "Login successful");
        REQUIRE(login_json.contains("token"));
        REQUIRE(login_json.contains("user"));
        REQUIRE(login_json["user"]["email"] == test_email);
        std::string jwt_token = login_json["token"].get<std::string>();
        LOG_INFO("Logged in, received token: {0}", jwt_token.substr(0, 30) + "..."); // Log first 30 chars

        // 4. Access a protected route (e.g., /users/me) with the token
        httplib::Headers headers = {
            {"Authorization", "Bearer " + jwt_token}
        };
        auto profile_res = cli.Get("/users/me", headers);
        REQUIRE(profile_res);
        REQUIRE(profile_res->status == 200);
        auto profile_json = nlohmann::json::parse(profile_res->body);
        REQUIRE(profile_json["id"] == registered_user_id);
        REQUIRE(profile_json["email"] == test_email);

        // 5. Try accessing protected route without token (should fail)
        auto unauth_profile_res = cli.Get("/users/me");
        REQUIRE(unauth_profile_res);
        REQUIRE(unauth_profile_res->status == 401);

        // 6. Try accessing admin route with customer token (should fail)
        auto admin_res = cli.Get("/admin/users", headers);
        REQUIRE(admin_res);
        REQUIRE(admin_res->status == 403);
    }
}
```