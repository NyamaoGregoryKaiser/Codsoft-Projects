```cpp
#include "AuthService.h"
#include "models/User.h"
#include "utils/PasswordHasher.h"
#include "utils/JwtManager.h"
#include "utils/Logger.h"
#include <drogon/orm/Mapper.h>
#include <drogon/drogon.h> // For app().getDbClient() and thread pool

namespace ApexContent::Service {

drogon::orm::DbClientPtr AuthService::dbClient_ = drogon::app().getDbClient();

std::pair<std::string, std::string> AuthService::login(const std::string& username, const std::string& password) {
    drogon::orm::Mapper<ApexContent::Model::User> mapper(dbClient_);
    try {
        auto users = mapper.findBy(drogon::orm::Criteria("username", drogon::orm::CompareOperator::EQ, username));
        if (users.empty()) {
            LOG_WARN << "Login failed: User " << username << " not found.";
            throw std::runtime_error("Invalid credentials");
        }
        auto user = users[0];
        if (ApexContent::Utils::PasswordHasher::verifyPassword(password, user.getValueOfPasswordHash(), user.getValueOfPasswordSalt())) {
            LOG_INFO << "User " << username << " logged in successfully.";
            // Fetch roles
            auto roles = user.getRoles(dbClient_).get();
            return ApexContent::Utils::JwtManager::generateTokens(user.getValueOfId(), user.getValueOfUsername(), roles);
        } else {
            LOG_WARN << "Login failed: Invalid password for user " << username;
            throw std::runtime_error("Invalid credentials");
        }
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR << "Database error during login for user " << username << ": " << e.what();
        throw std::runtime_error("Database error");
    } catch (const std::exception& e) {
        throw; // Re-throw other exceptions
    }
}

std::pair<std::string, std::string> AuthService::registerUser(const std::string& username, const std::string& email, const std::string& password) {
    drogon::orm::Mapper<ApexContent::Model::User> userMapper(dbClient_);
    drogon::orm::Mapper<ApexContent::Model::Role> roleMapper(dbClient_);
    drogon::orm::Mapper<ApexContent::Model::UserRole> userRoleMapper(dbClient_);

    try {
        // Check if username or email already exists
        auto existingUsers = userMapper.findBy(
            drogon::orm::Criteria("username", drogon::orm::CompareOperator::EQ, username) ||
            drogon::orm::Criteria("email", drogon::orm::CompareOperator::EQ, email)
        );
        if (!existingUsers.empty()) {
            LOG_WARN << "Registration failed: User with username " << username << " or email " << email << " already exists.";
            throw std::runtime_error("Username or email already exists");
        }

        // Hash password
        auto [passwordHash, passwordSalt] = ApexContent::Utils::PasswordHasher::hashPassword(password);

        // Create new user
        ApexContent::Model::User newUser;
        newUser.setUsername(username);
        newUser.setEmail(email);
        newUser.setPasswordHash(passwordHash);
        newUser.setPasswordSalt(passwordSalt);
        newUser.setCreatedAt(drogon::orm::Date(drogon::utils::get                  ()->toLocalTime()));
        newUser.setUpdatedAt(drogon::orm::Date(drogon::utils::get                  ()->toLocalTime()));

        // Save user
        auto savedUser = userMapper.insert(newUser);
        LOG_INFO << "New user registered: " << username << " (ID: " << savedUser.getValueOfId() << ")";

        // Assign default role (e.g., "user")
        auto defaultRoles = roleMapper.findBy(drogon::orm::Criteria("name", drogon::orm::CompareOperator::EQ, "user"));
        if (defaultRoles.empty()) {
            LOG_ERROR << "Default 'user' role not found in DB for new registration!";
            // Optionally create it or handle error appropriately
            throw std::runtime_error("Internal server error: Default role missing.");
        }
        ApexContent::Model::Role userRole = defaultRoles[0];

        ApexContent::Model::UserRole newUserRole;
        newUserRole.setUserId(savedUser.getValueOfId());
        newUserRole.setRoleId(userRole.getValueOfId());
        userRoleMapper.insert(newUserRole);
        LOG_DEBUG << "Assigned 'user' role to new user " << username;

        // Generate tokens
        return ApexContent::Utils::JwtManager::generateTokens(savedUser.getValueOfId(), savedUser.getValueOfUsername(), {"user"});

    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR << "Database error during registration for user " << username << ": " << e.what();
        throw std::runtime_error("Database error");
    } catch (const std::exception& e) {
        throw; // Re-throw other exceptions
    }
}

std::pair<std::string, std::string> AuthService::refreshTokens(const std::string& refreshToken) {
    auto claims = ApexContent::Utils::JwtManager::verifyRefreshToken(refreshToken);
    if (!claims) {
        LOG_WARN << "Refresh token invalid or expired.";
        throw std::runtime_error("Invalid or expired refresh token");
    }

    int userId = claims.value()["userId"].asInt();
    std::string username = claims.value()["username"].asString();
    
    // Re-fetch user roles to ensure they are current
    drogon::orm::Mapper<ApexContent::Model::User> userMapper(dbClient_);
    try {
        auto user = userMapper.findByPrimaryKey(userId);
        auto roles = user.getRoles(dbClient_).get();
        LOG_INFO << "Refreshed tokens for user " << username;
        return ApexContent::Utils::JwtManager::generateTokens(userId, username, roles);
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR << "Database error during token refresh for user " << username << ": " << e.what();
        throw std::runtime_error("Database error during token refresh.");
    }
}

} // namespace ApexContent::Service
```