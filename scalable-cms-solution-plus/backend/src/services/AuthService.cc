#include "AuthService.h"
#include "utils/PasswordHasher.h"
#include "utils/Logger.h"
#include "services/TokenService.h"
#include "database/DbClientManager.h"
#include "common/Constants.h"
#include "config/AppConfig.h"

// Drogon ORM includes
#include <drogon/orm/Mapper.h>
#include <drogon/orm/Criteria.h>
#include <drogon/orm/Exception.h>

AuthService::AuthService() {
    // Constructor logic, if any
}

AuthService& AuthService::instance() {
    static AuthService instance;
    return instance;
}

std::optional<LoginResponse> AuthService::loginUser(const std::string& email, const std::string& password) {
    auto dbClient = DbClientManager::instance().getDbClient();
    if (!dbClient) {
        LOG_CRITICAL("Database client unavailable for login.");
        return std::nullopt;
    }

    drogon::orm::Mapper<drogon_model::cms_system::User> userMapper(dbClient);
    try {
        // Find user by email
        auto users = userMapper.findBy(drogon::orm::Criteria("email", drogon::orm::CompareOperator::EQ, email));

        if (users.empty()) {
            LOG_DEBUG("Login attempt for non-existent email: {}", email);
            return std::nullopt; // User not found
        }

        const auto& user = users[0];
        
        // Verify password
        if (!PasswordHasher::verifyPassword(password, user.getPasswordHash())) {
            LOG_DEBUG("Login attempt with incorrect password for email: {}", email);
            return std::nullopt; // Incorrect password
        }

        // Generate tokens
        std::string accessToken = cms::TokenService::instance().generateAccessToken(user.getId(), user.getRole());
        std::string refreshToken = cms::TokenService::instance().generateRefreshToken(user.getId(), user.getRole());

        LOG_INFO("User {} logged in successfully.", user.getEmail());
        return LoginResponse{user.getId(), accessToken, refreshToken, user.getRole()};

    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR("Database error during login for {}: {}", email, e.what());
        return std::nullopt;
    } catch (const std::exception& e) {
        LOG_ERROR("Unexpected error during login for {}: {}", email, e.what());
        return std::nullopt;
    }
}

std::optional<drogon_model::cms_system::User> AuthService::registerUser(const std::string& email,
                                                                        const std::string& password,
                                                                        cms::UserRole role) {
    auto dbClient = DbClientManager::instance().getDbClient();
    if (!dbClient) {
        LOG_CRITICAL("Database client unavailable for registration.");
        return std::nullopt;
    }

    drogon::orm::Mapper<drogon_model::cms_system::User> userMapper(dbClient);
    try {
        // Check if user already exists
        auto existingUsers = userMapper.findBy(drogon::orm::Criteria("email", drogon::orm::CompareOperator::EQ, email));
        if (!existingUsers.empty()) {
            LOG_WARN("Registration attempt with existing email: {}", email);
            return std::nullopt; // User already exists
        }

        // Hash password
        std::string hashedPassword = PasswordHasher::hashPassword(password, AppConfig::getInt("password_hash_salt_rounds", 10));
        if (hashedPassword.empty()) {
            LOG_ERROR("Failed to hash password during registration for {}.", email);
            return std::nullopt;
        }

        // Create new user object
        drogon_model::cms_system::User newUser;
        newUser.setEmail(email);
        newUser.setPasswordHash(hashedPassword);
        newUser.setRole(role);
        // Drogon ORM will set created_at and updated_at if configured in schema.
        // Or you can set them manually here:
        // newUser.setCreatedAt(std::chrono::system_clock::now());
        // newUser.setUpdatedAt(std::chrono::system_clock::now());

        // Insert into database
        drogon_model::cms_system::User createdUser = userMapper.insertAndGetId(newUser);
        LOG_INFO("New user registered successfully with ID: {}", createdUser.getId());
        return createdUser;

    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR("Database error during registration for {}: {}", email, e.what());
        return std::nullopt;
    } catch (const std::exception& e) {
        LOG_ERROR("Unexpected error during registration for {}: {}", email, e.what());
        return std::nullopt;
    }
}

std::optional<LoginResponse> AuthService::refreshTokens(const std::string& refreshToken) {
    try {
        cms::TokenPayload payload = cms::TokenService::instance().verifyToken(refreshToken);

        if (payload.tokenType != "refresh") {
            LOG_WARN("Provided token is not a refresh token.");
            return std::nullopt;
        }

        // Lookup user to ensure ID is valid and retrieve current role
        auto dbClient = DbClientManager::instance().getDbClient();
        if (!dbClient) {
            LOG_CRITICAL("Database client unavailable for token refresh.");
            return std::nullopt;
        }

        drogon::orm::Mapper<drogon_model::cms_system::User> userMapper(dbClient);
        auto userOpt = userMapper.findByPrimaryKey(payload.userId);
        if (!userOpt) {
            LOG_WARN("User ID from refresh token not found: {}", payload.userId);
            return std::nullopt;
        }
        cms::UserRole currentUserRole = userOpt->getRole(); // Get current role from DB

        // Generate new tokens
        std::string newAccessToken = cms::TokenService::instance().generateAccessToken(payload.userId, currentUserRole);
        std::string newRefreshToken = cms::TokenService::instance().generateRefreshToken(payload.userId, currentUserRole);
        
        // Blacklist the old refresh token (optional, but good for security to prevent replay)
        cms::TokenService::instance().blacklistToken(refreshToken);

        LOG_INFO("Tokens refreshed for user ID: {}", payload.userId);
        return LoginResponse{payload.userId, newAccessToken, newRefreshToken, currentUserRole};

    } catch (const jwt::error::token_verification_exception& e) {
        LOG_WARN("Refresh token verification failed: {}", e.what());
        return std::nullopt;
    } catch (const std::exception& e) {
        LOG_ERROR("Unexpected error during token refresh: {}", e.what());
        return std::nullopt;
    }
}

void AuthService::logoutUser(const std::string& accessToken, const std::string& refreshToken) {
    if (!accessToken.empty()) {
        cms::TokenService::instance().blacklistToken(accessToken);
        LOG_INFO("Access token blacklisted during logout.");
    }
    if (!refreshToken.empty()) {
        cms::TokenService::instance().blacklistToken(refreshToken);
        LOG_INFO("Refresh token blacklisted during logout.");
    }
}
```