#include <catch2/catch_all.hpp>
#include "../../src/utils/jwt_manager.h"
#include "../../src/utils/app_config.h"
#include <chrono>
#include <thread>

// Ensure JWT_SECRET is set for tests
struct JwtManagerTestSetup {
    JwtManagerTestSetup() {
        if (std::getenv("JWT_SECRET") == nullptr) {
            setenv("JWT_SECRET", "supersecretjwtkeyforTESTING", 1);
            setenv("JWT_EXPIRATION_SECONDS", "1", 1); // Short expiration for testing
            setenv("JWT_REFRESH_EXPIRATION_SECONDS", "10", 1);
        }
        AppConfig::Config::getInstance(); // Reload config with test values
    }
};

static JwtManagerTestSetup jwt_test_setup;

TEST_CASE("JwtManager handles token generation and verification", "[JwtManager][Unit]") {
    Security::JwtManager jwt_manager;
    std::string test_user_id = "test_user_123";
    std::string test_user_role = "USER";

    SECTION("Generate and verify an access token") {
        std::string access_token = jwt_manager.generateAccessToken(test_user_id, test_user_role);
        REQUIRE_FALSE(access_token.empty());

        Security::TokenClaims claims = jwt_manager.verifyToken(access_token);
        REQUIRE(claims.userId == test_user_id);
        REQUIRE(claims.role == test_user_role);
        REQUIRE(claims.type == "access");
    }

    SECTION("Generate and verify a refresh token") {
        std::string refresh_token = jwt_manager.generateRefreshToken(test_user_id, test_user_role);
        REQUIRE_FALSE(refresh_token.empty());

        Security::TokenClaims claims = jwt_manager.verifyToken(refresh_token);
        REQUIRE(claims.userId == test_user_id);
        REQUIRE(claims.role == test_user_role);
        REQUIRE(claims.type == "refresh");
    }

    SECTION("Verification fails for an invalid token") {
        std::string invalid_token = "invalid.jwt.token";
        REQUIRE_THROWS_AS(jwt_manager.verifyToken(invalid_token), std::runtime_error);
    }

    SECTION("Verification fails for a token with incorrect signature") {
        std::string forged_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmb3JnZWRfdXNlciIsImV4cCI6MTkwMDE2MjAwMH0.SomeFakeSignature";
        REQUIRE_THROWS_AS(jwt_manager.verifyToken(forged_token), std::runtime_error);
    }

    SECTION("Verification fails for an expired token") {
        // Access token expires in 1 second as configured in JwtManagerTestSetup
        std::string expired_token = jwt_manager.generateAccessToken(test_user_id, test_user_role);
        std::this_thread::sleep_for(std::chrono::seconds(2)); // Wait for token to expire

        REQUIRE_THROWS_AS(jwt_manager.verifyToken(expired_token), std::runtime_error);
    }

    SECTION("Different secret should invalidate token") {
        std::string original_token = jwt_manager.generateAccessToken(test_user_id, test_user_role);

        // Temporarily change secret to simulate wrong secret
        std::string old_secret = AppConfig::Config::getInstance().jwt_secret;
        setenv("JWT_SECRET", "completely_different_secret", 1);
        AppConfig::Config::getInstance(); // Reload config
        
        REQUIRE_THROWS_AS(jwt_manager.verifyToken(original_token), std::runtime_error);

        // Restore original secret
        setenv("JWT_SECRET", old_secret.c_str(), 1);
        AppConfig::Config::getInstance();
    }
}