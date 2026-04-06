#define CATCH_CONFIG_MAIN // This tells Catch to provide a main() - only do this in one cpp file
#include <catch2/catch_all.hpp>
#include <iostream>
#include <sodium.h> // For libsodium init
#include "../src/utils/app_config.h" // For config loading
#include "../src/utils/logger.h" // For logger setup

// Global setup for tests
struct GlobalTestSetup {
    GlobalTestSetup() {
        std::cout << "Global Test Setup: Initializing..." << std::endl;
        // Load configuration for tests (e.g., from .env.example or test-specific .env)
        // For CI/CD, these will be injected as env vars.
        // During local testing, ensure .env.example is copied/sourced.
        // For simplicity, directly set dummy env vars for tests if not available.
        if (std::getenv("APP_PORT") == nullptr) {
            setenv("APP_PORT", "8080", 1);
            setenv("DB_HOST", "localhost", 1); // For local test DB
            setenv("DB_PORT", "5432", 1);
            setenv("DB_NAME", "test_db", 1);
            setenv("DB_USER", "test_user", 1);
            setenv("DB_PASSWORD", "test_pass", 1);
            setenv("JWT_SECRET", "supersecretjwtkeyforTESTING", 1);
            setenv("JWT_EXPIRATION_SECONDS", "3600", 1);
            setenv("JWT_REFRESH_EXPIRATION_SECONDS", "604800", 1);
            setenv("LOG_LEVEL", "warn", 1); // Reduce log noise in tests
            setenv("RATE_LIMIT_ENABLED", "false", 1);
            setenv("RATE_LIMIT_MAX_REQUESTS", "10", 1);
            setenv("RATE_LIMIT_WINDOW_SECONDS", "60", 1);
        }

        AppConfig::Config::getInstance();
        Logger::AppLogger::get(); // Initialize logger

        if (sodium_init() < 0) {
            std::cerr << "libsodium initialization failed during test setup!" << std::endl;
            exit(EXIT_FAILURE);
        }
        std::cout << "libsodium initialized for tests." << std::endl;

        // Optionally, prepare a test database schema here
        // (For integration tests)
    }

    ~GlobalTestSetup() {
        std::cout << "Global Test Teardown: Cleaning up..." << std::endl;
        // Clean up test database if necessary
    }
};

// This ensures our global setup/teardown runs once
static GlobalTestSetup G_TEST_SETUP;