```cpp
#include <gtest/gtest.h>
#include <chrono>
#include <thread>
#include <vector>
#include <iostream>
#include <algorithm> // For std::min/max
#include "../../src/api/ApiServer.h" // Include API server if direct calls are made
#include "../../src/config/ConfigManager.h"
#include "../../src/utils/Logger.h"
#include <pistache/http.h>
#include <pistache/client.h>
#include <nlohmann/json.hpp>

// This is a basic C++ performance test using Pistache client.
// For enterprise-grade performance testing, tools like Apache JMeter, Locust (Python), or k6 (JS) are preferred.
// This test provides a framework within C++ for a simple load simulation.

const std::string PERF_TEST_USER = "perf_user";
const std::string PERF_TEST_PASSWORD = "perfpassword123";
std::string perf_test_jwt;
std::string perf_test_user_id;

class PerformanceTest : public ::testing::Test {
protected:
    static void SetUpTestSuite() {
        Scraper::Utils::Logger::init("perf_test_logger", "/dev/null"); // Mute logger
        Scraper::Config::ConfigManager::getInstance().loadConfig("../../config/.env.example");

        // Start a dedicated instance of the application if not already running
        // For performance tests, it's often better to have the application running separately,
        // rather than starting/stopping for each test fixture.
        // For this example, we'll assume a running backend, similar to API integration tests.
        // If not running, uncomment and adapt the ApiIntegrationTest SetUpTestSuite logic:
        // api_test_app = std::make_unique<Scraper::App>();
        // ... (start app in detached thread) ...
        // ... (wait for health check) ...

        // Use the same client setup as integration tests
        Pistache::Http::Client client;
        client.init();
        std::string base_url = "http://localhost:9080";

        // Register/Login a dedicated user for performance tests
        try {
            auto register_request = client.post(base_url + "/api/v1/auth/register");
            register_request.headers().add<Pistache::Http::Header::ContentType>(Pistache::Http::Mime::MediaType("application/json"));
            nlohmann::json user_data = {
                {"username", PERF_TEST_USER},
                {"email", "perf_user@example.com"},
                {"password", PERF_TEST_PASSWORD}
            };
            auto response = register_request.send(user_data.dump()).get();
            if (response.code() == Pistache::Http::Code::Created) {
                nlohmann::json response_body = nlohmann::json::parse(response.body());
                perf_test_jwt = response_body["token"].get<std::string>();
            } else if (response.code() == Pistache::Http::Code::BadRequest && response.body().find("Username already taken.") != std::string::npos) {
                // User already exists, try logging in
                auto login_request = client.post(base_url + "/api/v1/auth/login");
                login_request.headers().add<Pistache::Http::Header::ContentType>(Pistache::Http::Mime::MediaType("application/json"));
                nlohmann::json login_data = {
                    {"username", PERF_TEST_USER},
                    {"password", PERF_TEST_PASSWORD}
                };
                auto login_response = login_request.send(login_data.dump()).get();
                if (login_response.code() == Pistache::Http::Code::Ok) {
                    nlohmann::json login_body = nlohmann::json::parse(login_response.body());
                    perf_test_jwt = login_body["token"].get<std::string>();
                } else {
                    FAIL() << "Failed to login performance test user: " << login_response.body();
                }
            } else {
                FAIL() << "Failed to register performance test user: " << response.body();
            }

            // Get user ID
            std::optional<Scraper::Database::Models::User> user_opt = Scraper::Database::DatabaseManager::getInstance().getUserByUsername(PERF_TEST_USER);
            ASSERT_TRUE(user_opt.has_value());
            perf_test_user_id = user_opt->id;

        } catch (const std::exception& e) {
            FAIL() << "Setup for performance test failed: " << e.what();
        }
        client.shutdown();
    }

    static void TearDownTestSuite() {
        // Cleanup resources if any
        // if (api_test_app) { api_test_app->shutdown(); }
    }
};

struct LatencyStats {
    long min_ms = std::numeric_limits<long>::max();
    long max_ms = std::numeric_limits<long>::min();
    long total_ms = 0;
    int count = 0;
    long avg_ms() const { return count > 0 ? total_ms / count : 0; }
};

// Function to simulate a single client hitting an endpoint
void simulate_client(const std::string& url, const std::string& token, int num_requests, LatencyStats& stats, std::mutex& stats_mutex) {
    Pistache::Http::Client client;
    client.init();

    for (int i = 0; i < num_requests; ++i) {
        auto start_time = std::chrono::high_resolution_clock::now();
        try {
            auto request = client.get(url);
            if (!token.empty()) {
                request.headers().add<Pistache::Http::Header::Authorization>(Pistache::Http::Header::Authorization(token, "Bearer"));
            }
            auto response = request.send().get();
            // Optional: check response code or body
            // if (response.code() != Pistache::Http::Code::Ok) {
            //     std::cerr << "Request failed: " << response.code() << std::endl;
            // }
        } catch (const std::exception& e) {
            std::cerr << "Request error: " << e.what() << std::endl;
        }
        auto end_time = std::chrono::high_resolution_clock::now();
        long duration_ms = std::chrono::duration_cast<std::chrono::milliseconds>(end_time - start_time).count();

        std::lock_guard<std::mutex> lock(stats_mutex);
        stats.min_ms = std::min(stats.min_ms, duration_ms);
        stats.max_ms = std::max(stats.max_ms, duration_ms);
        stats.total_ms += duration_ms;
        stats.count++;
    }
    client.shutdown();
}

TEST_F(PerformanceTest, ConcurrentJobListing) {
    const int NUM_THREADS = 10;
    const int REQUESTS_PER_THREAD = 100;
    const std::string URL = "http://localhost:9080/api/v1/jobs";

    std::vector<std::thread> threads;
    LatencyStats global_stats;
    std::mutex stats_mutex;

    auto test_start = std::chrono::high_resolution_clock::now();

    for (int i = 0; i < NUM_THREADS; ++i) {
        threads.emplace_back(simulate_client, URL, perf_test_jwt, REQUESTS_PER_THREAD, std::ref(global_stats), std::ref(stats_mutex));
    }

    for (auto& t : threads) {
        t.join();
    }

    auto test_end = std::chrono::high_resolution_clock::now();
    long total_test_duration_ms = std::chrono::duration_cast<std::chrono::milliseconds>(test_end - test_start).count();

    std::cout << "\n--- Performance Test Results (Concurrent Job Listing) ---" << std::endl;
    std::cout << "Total Requests: " << global_stats.count << std::endl;
    std::cout << "Total Duration: " << total_test_duration_ms << " ms" << std::endl;
    std::cout << "Requests per Second (RPS): " << (global_stats.count * 1000.0 / total_test_duration_ms) << std::endl;
    std::cout << "Min Latency: " << global_stats.min_ms << " ms" << std::endl;
    std::cout << "Max Latency: " << global_stats.max_ms << " ms" << std::endl;
    std::cout << "Avg Latency: " << global_stats.avg_ms() << " ms" << std::endl;
    std::cout << "------------------------------------------------------" << std::endl;

    // Assertions for performance targets (example values)
    ASSERT_GT(global_stats.count, 0); // Ensure requests were made
    // Example: average latency should be under 200ms
    // This will depend heavily on environment and actual scraping logic.
    // For a simple DB fetch, it should be low.
    ASSERT_LT(global_stats.avg_ms(), 200) << "Average latency exceeded 200ms.";
    ASSERT_GT((global_stats.count * 1000.0 / total_test_duration_ms), 50) << "RPS fell below 50."; // Example RPS
}

// Add more performance tests for other endpoints (e.g., creating a job, fetching scraped data)
// For endpoints that modify state (POST/PUT/DELETE), ensure proper cleanup or test against temporary resources.
// For `POST /api/v1/jobs`, the request body needs to be dynamically generated for uniqueness.
// This is best handled by dedicated load testing tools or more complex C++ test harness.

// Example: Simulate creating multiple jobs
/*
void simulate_create_job(const std::string& url, const std::string& token, int num_requests, LatencyStats& stats, std::mutex& stats_mutex) {
    Pistache::Http::Client client;
    client.init();

    for (int i = 0; i < num_requests; ++i) {
        auto start_time = std::chrono::high_resolution_clock::now();
        try {
            auto request = client.post(url);
            request.headers().add<Pistache::Http::Header::Authorization>(Pistache::Http::Header::Authorization(token, "Bearer"));
            request.headers().add<Pistache::Http::Header::ContentType>(Pistache::Http::Mime::MediaType("application/json"));
            nlohmann::json job_data = {
                {"name", "Perf-Test-Job-" + std::to_string(std::hash<std::thread::id>{}(std::this_thread::get_id())) + "-" + std::to_string(i)},
                {"target_url", "http://example.com/perf-test/" + std::to_string(i)},
                {"cron_schedule", "manual"},
                {"css_selector", ".perf-data"}
            };
            auto response = request.send(job_data.dump()).get();
            // Clean up the created job immediately if successful and if not too much overhead
            // Or run cleanup after the entire test suite.
        } catch (const std::exception& e) {
            std::cerr << "Request error (create job): " << e.what() << std::endl;
        }
        auto end_time = std::chrono::high_resolution_clock::now();
        long duration_ms = std::chrono::duration_cast<std::chrono::milliseconds>(end_time - start_time).count();

        std::lock_guard<std::mutex> lock(stats_mutex);
        stats.min_ms = std::min(stats.min_ms, duration_ms);
        stats.max_ms = std::max(stats.max_ms, duration_ms);
        stats.total_ms += duration_ms;
        stats.count++;
    }
    client.shutdown();
}

TEST_F(PerformanceTest, ConcurrentJobCreation) {
    const int NUM_THREADS = 5;
    const int REQUESTS_PER_THREAD = 10;
    const std::string URL = "http://localhost:9080/api/v1/jobs";

    std::vector<std::thread> threads;
    LatencyStats global_stats;
    std::mutex stats_mutex;

    auto test_start = std::chrono::high_resolution_clock::now();

    for (int i = 0; i < NUM_THREADS; ++i) {
        threads.emplace_back(simulate_create_job, URL, perf_test_jwt, REQUESTS_PER_THREAD, std::ref(global_stats), std::ref(stats_mutex));
    }

    for (auto& t : threads) {
        t.join();
    }

    auto test_end = std::chrono::high_resolution_clock::now();
    long total_test_duration_ms = std::chrono::duration_cast<std::chrono::milliseconds>(test_end - test_start).count();

    std::cout << "\n--- Performance Test Results (Concurrent Job Creation) ---" << std::endl;
    std::cout << "Total Requests: " << global_stats.count << std::endl;
    std::cout << "Total Duration: " << total_test_duration_ms << " ms" << std::endl;
    std::cout << "Requests per Second (RPS): " << (global_stats.count * 1000.0 / total_test_duration_ms) << std::endl;
    std::cout << "Min Latency: " << global_stats.min_ms << " ms" << std::endl;
    std::cout << "Max Latency: " << global_stats.max_ms << " ms" << std::endl;
    std::cout << "Avg Latency: " << global_stats.avg_ms() << " ms" << std::endl;
    std::cout << "--------------------------------------------------------" << std::endl;

    ASSERT_GT(global_stats.count, 0);
    ASSERT_LT(global_stats.avg_ms(), 500) << "Average latency for job creation exceeded 500ms."; // Creation is heavier
}
*/
```